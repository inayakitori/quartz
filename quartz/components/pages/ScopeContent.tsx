import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList, SortFn } from "../PageList"
import { FullSlug, getAllSegmentPrefixes, resolveRelative, simplifySlug } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"
import { ComponentChildren } from "preact"
import { concatenateResources } from "../../util/resources"
import { hashScope } from "../../plugins/emitters/scopePage"

interface ScopeContentOptions {
  sort?: SortFn
  numPages: number
}

const defaultOptions: ScopeContentOptions = {
  numPages: 10,
}

export default ((opts?: Partial<ScopeContentOptions>) => {
  const options: ScopeContentOptions = { ...defaultOptions, ...opts }

  const ScopeContent: QuartzComponent = (props: QuartzComponentProps) => {

    const { tree, fileData, allFiles, cfg } = props
    const slug = fileData.slug

    if (!(slug?.startsWith("scopes/") || slug === "scopes")) {
      throw new Error(`Component "ScopeContent" tried to render a non-scope page: ${slug}`)
    }

    const scope = simplifySlug(slug.slice("scopes/".length) as FullSlug)
    const allPagesWithScope = (scope: string) => scope.includes("root") ? 
      allFiles.filter((file) =>
        true,
      ) : [];

    const content = (
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath!, tree)
    ) as ComponentChildren
    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = cssClasses.join(" ")
    if (scope === "/") {
      const scopes = [
        ...new Set(
          allFiles.flatMap((data) => data.frontmatter?.scopes ?? []).flatMap((scopes) => scopes.split("/").flatMap(hashScope)),
        ),
      ].sort((a, b) => a.localeCompare(b))
      const scopeItemMap: Map<string, QuartzPluginData[]> = new Map()
      for (const scope of scopes) {
        scopeItemMap.set(scope, allPagesWithScope(scope))
      }
      return (
        <div class="popover-hint">
          <article class={classes}>
            <p>{content}</p>
          </article>
          <p>{i18n(cfg.locale).pages.tagContent.totalTags({ count: scopes.length })}</p>
          <div>
            {scopes.map((scope) => {
              const pages = scopeItemMap.get(scope)!
              const listProps = {
                ...props,
                allFiles: pages,
              }

              const contentPage = allFiles.filter((file) => file.slug === `scopes/${scope}`).at(0)

              const root = contentPage?.htmlAst
              const content =
                !root || root?.children.length === 0
                  ? contentPage?.description
                  : htmlToJsx(contentPage.filePath!, root)

              const tagListingPage = `/scopes/${scope}` as FullSlug
              const href = resolveRelative(fileData.slug!, tagListingPage)

              return (
                <div>
                  <h2>
                    <a class="internal scope-link" href={href}>
                      {scope}
                    </a>
                  </h2>
                  {content && <p>{content}</p>}
                  <div class="page-listing">
                    <p>
                      {i18n(cfg.locale).pages.tagContent.itemsUnderTag({ count: pages.length })}
                      {pages.length > options.numPages && (
                        <>
                          {" "}
                          <span>
                            {i18n(cfg.locale).pages.tagContent.showingFirst({
                              count: options.numPages,
                            })}
                          </span>
                        </>
                      )}
                    </p>
                    <PageList limit={options.numPages} {...listProps} sort={options?.sort} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    } else {
      const pages = allPagesWithScope(scope)
      const listProps = {
        ...props,
        allFiles: pages,
      }

      return (
        <div class="popover-hint">
          <article class={classes}>{content}</article>
          <div class="page-listing">
            <p>{i18n(cfg.locale).pages.tagContent.itemsUnderTag({ count: pages.length })}</p>
            <div>
              <PageList {...listProps} sort={options?.sort} />
            </div>
          </div>
        </div>
      )
    }
  }

  ScopeContent.css = concatenateResources(style, PageList.css)
  return ScopeContent
}) satisfies QuartzComponentConstructor
