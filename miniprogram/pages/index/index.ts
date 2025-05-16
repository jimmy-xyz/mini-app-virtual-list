// 所有的数据
const dataSource = [...Array(200)].map((_, i) => i + 1);

const PAGE_SIZE = 50;

// 每个 item 的高度
const ITEM_HEIGHT = 50;

// 可视区域前后缓冲区item个数
const BUFFER_SIZE = 10;

const throttle = (fn: () => void, delay = 200) => {
  let timer: number | null = null;
  return () => {
    if (timer) return;
    timer = setTimeout(() => {
      fn();
      timer = null;
    }, delay);
  };
};

Page({
  data: {
    // 已经加载的数据，作用：撑起高度，有滚动条
    loadedItems: [] as number[],
    // 应该渲染的数据
    renderedItems: [] as { data: number; transform: string }[],
    showNoMore: false,
    itemHeight: ITEM_HEIGHT
  },

  throttledRender: null as any,

  onReady() {
    this.getInitialData();
  },

  onLoad() {
    this.throttledRender = throttle(() => {
      this.getRenderedItems();
    });
  },

  getInitialData() {
    const initData = dataSource.slice(0, PAGE_SIZE);
    this.setData(
      {
        loadedItems: initData
      },
      () => {
        this.getRenderedItems();
      }
    );
  },

  throttleScroll() {
    this.throttledRender();
  },

  getListContainerBounding(): Promise<{ containerTop: number }> {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('.list-container').boundingClientRect();
      query.exec(res => {
        const containerTop = res[0].top;
        resolve({ containerTop });
      });
    });
  },

  async getRenderedItems() {
    const { loadedItems } = this.data;
    const { containerTop } = await this.getListContainerBounding();

    const windowInfo = wx.getWindowInfo();
    const windowHeight = windowInfo.windowHeight;

    // 展示内容视口高度
    const viewHeight = Math.min(windowHeight - containerTop, windowHeight);
    console.log('viewHeight', viewHeight);

    const visibleItemCount = Math.ceil(viewHeight / ITEM_HEIGHT);

    console.log('visibleItemCount:', visibleItemCount);
    if (containerTop > 0) {
      const _items = loadedItems.slice(0, visibleItemCount + BUFFER_SIZE);
      const _visibleItems = _items.map((item, index) => ({
        data: item,
        transform: `translateY(${index * ITEM_HEIGHT}px)`
      }));

      this.setData({ renderedItems: _visibleItems }, () => {
        console.log('Items1', this.data.renderedItems);
      });
      return;
    }

    const _startIndex = Math.floor(Math.abs(containerTop) / ITEM_HEIGHT);
    const startIndex = Math.max(0, _startIndex - BUFFER_SIZE);

    const endIndex = Math.min(
      loadedItems.length - 1,
      _startIndex + visibleItemCount + BUFFER_SIZE
    );

    console.log('startIndex', startIndex);
    console.log('endIndex', endIndex);

    const _visibleItems = loadedItems
      .slice(startIndex, endIndex + 1)
      .map((item, i) => {
        const index = startIndex + i;
        return {
          data: item,
          transform: `translateY(${index * ITEM_HEIGHT}px)`
        };
      });

    this.setData({ renderedItems: _visibleItems }, () => {
      console.log('Items2', this.data.renderedItems);
    });
  },

  handleLoadMore() {
    if (this.data.showNoMore) return;
    const startIndex = this.data.loadedItems.length;
    const endIndex = Math.min(startIndex + PAGE_SIZE, dataSource.length);
    const newItems = dataSource.slice(startIndex, endIndex);
    this.setData(
      {
        loadedItems: [...this.data.loadedItems, ...newItems]
      },
      () => {
        if (endIndex === dataSource.length) {
          this.setData({
            showNoMore: true
          });
        }
        console.log('loadedItems:', this.data.loadedItems);
      }
    );
  }
});
