import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, getAllSegmentPrefixes, hash, joinSegments, pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { write } from "./helpers"
import { i18n, TRANSLATIONS } from "../../i18n"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import ScopeContent from "../../components/pages/ScopeContent"

interface ScopePageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

export const ROOT = "root"
export const PUBLIC = "public"

export const hashScope = (scope: string) => {
  if(scope == PUBLIC || scope == "draft"){
    return scope
  } else {
    return scope + "-" + hash(scope).toString(36).slice(0, 6)
  }
}

function computeScopeInfo(
  allFiles: QuartzPluginData[],
  content: ProcessedContent[],
  locale: keyof typeof TRANSLATIONS,
): [Set<string>, Record<string, ProcessedContent>] {
  const scopes: Set<string> = new Set(
    allFiles.flatMap((data) => data.frontmatter?.scopes ?? []).flatMap((scopes) => scopes.split("/").flatMap(hashScope))
  )

  scopes.add(hashScope(ROOT))

  console.log(scopes)

  const tagDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
    [...scopes].map((tag) => {
      const title =
        tag === PUBLIC
          ? "Public Pages"
          : `Scope: ${tag}`
      return [
        tag,
        defaultProcessedContent({
          slug: joinSegments("scopes", tag) as FullSlug,
          frontmatter: { title, tags: [] },
        }),
      ]
    }),
  )

  // Update with actual content if available
  for (const [tree, file] of content) {
    const slug = file.data.slug!
    if (slug.startsWith("scopes/")) {
      const tag = slug.slice("scopes/".length)
      if (scopes.has(tag)) {
        tagDescriptions[tag] = [tree, file]
        if (file.data.frontmatter?.title === tag) {
          file.data.frontmatter.title = `${i18n(locale).pages.tagContent.tag}: ${tag}`
        }
      }
    }
  }

  return [scopes, tagDescriptions]
}

async function processScopePage(
  ctx: BuildCtx,
  tag: string,
  tagContent: ProcessedContent,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const slug = joinSegments("scopes", tag) as FullSlug
  const [tree, file] = tagContent
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData: file.data,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles,
  }

  const content = renderPage(cfg, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug: file.data.slug!,
    ext: ".html",
  })
}

export const ScopePage: QuartzEmitterPlugin<Partial<ScopePageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: ScopeContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "ScopePage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration
      const [tags, tagDescriptions] = computeScopeInfo(allFiles, content, cfg.locale)

      for (const tag of tags) {
        yield processScopePage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      // Find all tags that need to be updated based on changed files
      const affectedTags: Set<string> = new Set()
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        const slug = changeEvent.file.data.slug!

        // If it's a tag page itself that changed
        if (slug.startsWith("scopes/")) {
          const tag = slug.slice("scopes/".length)
          affectedTags.add(tag)
        }

        // If a file with tags changed, we need to update those tag pages
        const fileTags = changeEvent.file.data.frontmatter?.tags ?? []
        fileTags.flatMap(getAllSegmentPrefixes).forEach((tag) => affectedTags.add(tag))

      }

      // If there are affected tags, rebuild their pages
      if (affectedTags.size > 0) {
        // We still need to compute all tags because tag pages show all tags
        const [_tags, tagDescriptions] = computeScopeInfo(allFiles, content, cfg.locale)

        for (const tag of affectedTags) {
          if (tagDescriptions[tag]) {
            yield processScopePage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
          }
        }
      }
    },
  }
}
