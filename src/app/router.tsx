import { createBrowserRouter } from "react-router-dom";
import { getPagePath } from "../config/pages";
import { pageComponents } from "./pageComponents";
import { routedPages } from "./routedPages";

export const router = createBrowserRouter(
  routedPages.map((pageId) => {
    const PageComponent = pageComponents[pageId];

    return {
      path: getPagePath(pageId),
      element: <PageComponent />,
    };
  })
);
