import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/inayakitori",
      Email: "mailto:inayakitorikhurram@gmail.com"
    },
  }),
}

const modifiedExplorer = Component.Explorer({
      filterFn: (node) => {
        return node.data?.tags.includes("top-level") !== false
      }
    });

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    // Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    modifiedExplorer,
  ],
  right: [
    Component.ConditionalRender({
      component: Component.Graph({localGraph: {
        depth: 3,
        showTags: false,
      }}),
      condition: (page) => !!page.fileData.frontmatter?.scopes?.includes("public")
    })
    ,
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    modifiedExplorer,
  ],
  right: [],
}
