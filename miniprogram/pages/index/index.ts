// index.ts

// 所有的数据
const dataSource = [...Array(10000)].map((_, i) => i + 1);

const PAGE_SIZE = 50;

const ITEM_HEIGHT = 50;

const BUFFER_SIZE = 5;

Page({
  data: {
    // 已经加载的数据
    loadedItems: [],
    // 当前可见的数据
    visibleItems: [],
    // 是否显示加载更多按钮
    showMoreBtn: true,
    // 每个 item 的高度
    itemHeight: ITEM_HEIGHT,
    // 滚动位置
    scrollTop: 0
  },

  onScroll(e) {
    const { scrollTop } = e.detail;
    this.setData(
      {
        scrollTop
      },
      () => {
        this.getVisibleItems();
      }
    );
  },

  getHeaderHeight(): Promise<number> {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('.header').boundingClientRect();
      query.exec(res => {
        const headerHeight = res[0].height;
        resolve(headerHeight);
      });
    });
  },
  getScrollViewHeight(): Promise<number> {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('.page-view').boundingClientRect();
      query.exec(res => {
        const containerHeight = res[0].height;
        resolve(containerHeight);
      });
    });
  },

  async getVisibleItems() {
    const { scrollTop, loadedItems } = this.data;
    const headerHeight = await this.getHeaderHeight();
    const containerHeight = await this.getScrollViewHeight();
    console.log('containerHeight:', containerHeight);
    console.log('scrollTop:', scrollTop);
    console.log('headerHeight:', headerHeight);

    const adjustedScrollTop = Math.max(0, scrollTop - headerHeight);

    if (scrollTop < headerHeight) {
      const visibleCount = Math.ceil(
        (containerHeight - headerHeight) / ITEM_HEIGHT
      );
      const _visibleItems = Array.from(
        { length: Math.min(visibleCount + BUFFER_SIZE, loadedItems.length) },
        (_, i) => ({
          item: loadedItems[i],
          index: i,
          transform: `translateY(${i * ITEM_HEIGHT}px)`
        })
      );
      this.setData(
        {
          visibleItems: _visibleItems
        },
        () => {
          console.log('visibleItems1', this.data.visibleItems);
        }
      );
      return;
    }

    const startIndex = Math.max(
      0,
      Math.floor(adjustedScrollTop / ITEM_HEIGHT) - BUFFER_SIZE
    );
    const endIndex = Math.min(
      loadedItems.length - 1,
      Math.ceil((adjustedScrollTop + containerHeight) / ITEM_HEIGHT) +
        BUFFER_SIZE
    );

    const _visibleItems = Array.from(
      { length: endIndex - startIndex + 1 },
      (_, i) => {
        const index = startIndex + i;
        return {
          item: loadedItems[index],
          index,
          transform: `translateY(${index * ITEM_HEIGHT}px)`
        };
      }
    );

    this.setData(
      {
        visibleItems: _visibleItems
      },
      () => {
        console.log('visibleItems2', this.data.visibleItems);
      }
    );
  },

  handleLoadMore() {
    console.log('加载更多');
    this.setData(
      {
        loadedItems: [
          ...this.data.loadedItems,
          ...dataSource.slice(
            this.data.loadedItems.length,
            this.data.loadedItems.length + PAGE_SIZE
          )
        ]
      },
      () => {
        console.log('加载更多后的 loadedItems:', this.data.loadedItems);
      }
    );
  },

  getInitialData() {
    const initData = dataSource.slice(0, PAGE_SIZE);
    this.setData(
      {
        loadedItems: initData
      },
      () => {
        this.getVisibleItems();
      }
    );
  },

  onReady() {
    this.getInitialData();
  }
});
