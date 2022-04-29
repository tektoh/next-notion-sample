import { parsePageId } from "notion-utils"

const NOTION_PAGE_ID = parsePageId(process.env.NOTION_PAGE_ID);
const NOTION_TOKEN_V2 = process.env.NOTION_TOKEN_V2;

export default function Home(props) {
  return <div>{JSON.stringify(props)}</div>;
}

export const getServerSideProps = async () => {
  const time = Date.now();
  const pageChunk = await loadCachedPageChunk(time, { stack: [] }, 0);
  return { props: pageChunk }
};

const loadCachedPageChunk = async (time, cursor, chunkNumber, spaceId = null) => {
  console.log("loadCachedPageChunk", time, cursor ? cursor.stack ? cursor.stack.length : -1 : -2, chunkNumber, spaceId);

  const body = {
    limit: 100,
    cursor,
    chunkNumber,
    verticalColumns: false
  };

  if (spaceId) {
    body.page = {
      id: NOTION_PAGE_ID,
      spaceId,
    };
  } else {
    body.pageId = NOTION_PAGE_ID;
  }

  const pageChunk = await fetch("https://www.notion.so/api/v3/loadCachedPageChunk", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cookie": `token_v2=${NOTION_TOKEN_V2}`
    }
  }).then(res => {
    if (res.status !== 200) {
      console.log("loadCachedPageChunk Error", time, res.status)
    }
    return res.json()
  });

  if (pageChunk.cursor ? pageChunk.cursor.stack ? pageChunk.cursor.stack.length : false : false) {
    const { recordMap: nextPageRecordMap } = await loadCachedPageChunk(
        time,
        pageChunk.cursor,
        chunkNumber + 1,
        pageChunk.recordMap.block[NOTION_PAGE_ID].value.space_id
    );
    if (nextPageRecordMap) {
      pageChunk.recordMap.block = {
        ...pageChunk.recordMap.block,
        ...(nextPageRecordMap.block || {})
      };
      pageChunk.recordMap.collection = {
        ...(pageChunk.recordMap.collection || {}),
        ...(nextPageRecordMap.collection || {}),
      };
      pageChunk.recordMap.collection_view = {
        ...(pageChunk.recordMap.collection_view || {}),
        ...(nextPageRecordMap.collection_view || {}),
      };
    }
  }

  return pageChunk;
}