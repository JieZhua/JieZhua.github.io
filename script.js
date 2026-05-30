const waveText = document.querySelector("[data-wave-text]"); // 找到需要做字母波浪动画的文字
const revealSections = document.querySelectorAll(".reveal-section"); // 找到所有需要滚动浮现的区块
const routeLinks = Array.from(document.querySelectorAll("[data-route]")); // 找到所有可以切换页面的链接
const navLinks = Array.from(document.querySelectorAll(".index-bar [data-route]")); // 找到顶部导航里的链接
const views = Array.from(document.querySelectorAll("[data-view]")); // 找到 Home、Designer、Developer 等页面视图
const collections = Array.from(document.querySelectorAll("[data-collection]")); // 找到可以左右切换项目的页面
const articleOpeners = Array.from(document.querySelectorAll("[data-open-article]")); // 找到项目封面按钮
const coverflow = document.querySelector("[data-coverflow]"); // 找到 Home 的 Works 区里的转盘
const coverflowCards = Array.from(document.querySelectorAll("[data-coverflow-article]")); // 找到转盘里的每张封面
const coverflowTitle = document.querySelector("[data-coverflow-title]"); // 找到转盘下方的当前标题

let currentCover = 0; // 记录 Works 区转盘当前在中间的是第几张
let coverflowDragStartX = 0; // 记录拖动开始时的鼠标位置
let coverflowDragDistance = 0; // 记录拖动距离
let coverflowIsDragging = false; // 记录现在是否正在拖动
let coverflowPointerCard = null; // 记录鼠标按下时点到的是哪张封面
let coverflowWheelLock = false; // 防止滚轮一次滚动触发太多次
let homeHelloTimer = window.setTimeout(finishHomeHello, 13000); // 第一次进入网页时，等 hello 写完后记录完成态

if (waveText) {
  const text = waveText.textContent; // 保存原始文字，比如 "to jiezhua.github.io"

  waveText.setAttribute("aria-label", text); // 给读屏软件保留完整文字
  waveText.textContent = ""; // 清空原始文字，准备重新放入单个字母

  [...text].forEach((letter, index) => {
    const span = document.createElement("span"); // 为每个字母创建一个 span

    span.textContent = letter === " " ? "\u00A0" : letter; // 空格改成不断行空格，避免被浏览器压缩
    span.style.setProperty("--i", index); // 给每个字母一个序号，用来控制动画延迟
    span.setAttribute("aria-hidden", "true"); // 单个字母不让读屏软件重复朗读
    waveText.appendChild(span); // 把这个字母放回域名文字里
  });

  waveText.classList.add("is-ready"); // 字母拆完后再启动 CSS 动画
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible"); // 区块进入视口后加 class，让 CSS 做浮现动画
      }
    });
  },
  {
    threshold: 0.28, // 区块露出约 28% 时触发浮现
  },
);

revealSections.forEach((section) => {
  revealObserver.observe(section); // 让观察器开始观察每个浮现区块
});

function finishHomeHello() {
  document.body.classList.add("home-hello-complete"); // 标记 hello 已经播放过，之后回 Home 直接显示完成态
  window.clearTimeout(homeHelloTimer); // 清掉定时器，避免重复执行
}

function getView(route) {
  return views.find((view) => view.dataset.view === route) || views[0]; // 按名字找页面，找不到就回到第一个页面
}

function setActiveNav(route, section) {
  navLinks.forEach((link) => {
    const linkSection = link.dataset.section; // 读取这个导航是否指向 Home 里的某个区块
    const isActive = linkSection
      ? route === "home" && linkSection === section
      : link.dataset.route === route && !section; // 区块导航和页面导航分开判断

    link.classList.toggle("is-active", isActive); // 当前页面或当前区块的导航链接加上 is-active
  });
}

function closeOpenArticles() {
  document.querySelectorAll(".article-content.is-open").forEach((content) => {
    content.classList.remove("is-open"); // 先关闭所有已经展开的项目正文
  });
}

function showCollectionItem(collection, index, shouldScroll = true) {
  const items = Array.from(collection.querySelectorAll(":scope > .article")); // 找到这个 collection 里的全部项目

  if (!items.length) {
    return; // 没有项目时直接结束
  }

  const nextIndex = (index + items.length) % items.length; // 让索引可以从最后一项循环到第一项
  const nextItem = items[nextIndex]; // 取出下一项项目
  const nextContent = nextItem.querySelector(".article-content"); // 找到这一项下面的正文

  collection.dataset.currentIndex = String(nextIndex); // 把当前项目序号记录在 HTML 上
  items.forEach((item, itemIndex) => {
    item.classList.toggle("is-current", itemIndex === nextIndex); // 只显示当前项目
  });

  closeOpenArticles(); // 切换项目时先关闭旧正文
  nextContent?.classList.add("is-open"); // 当前项目正文直接打开

  if (shouldScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" }); // 点左右箭头后回到当前页面顶部
  }
}

function revealArticle(articleName, shouldScroll = true) {
  const content = document.querySelector(`[data-article-content="${articleName}"]`); // 按名字找到项目正文

  if (!content) {
    return; // 找不到对应项目时直接结束
  }

  const article = content.closest(".article"); // 找到这个正文属于哪个项目
  const collection = article?.closest("[data-collection]"); // 找到这个项目属于哪个 collection

  if (article && collection) {
    const items = Array.from(collection.querySelectorAll(":scope > .article")); // 找到同组全部项目
    const articleIndex = items.indexOf(article); // 算出目标项目是第几个

    if (articleIndex >= 0) {
      showCollectionItem(collection, articleIndex, false); // 切换到目标项目，但先不滚动
    }
  }

  content.classList.add("is-open"); // 打开目标项目正文

  if (shouldScroll) {
    content.scrollIntoView({ behavior: "smooth", block: "start" }); // 滚动到正文开头
  }
}

function showView(route, options = {}) {
  const currentView = document.querySelector(".view.is-active"); // 记录切换前正在显示的页面
  const nextView = getView(route); // 找到要显示的页面
  const nextRoute = nextView.dataset.view; // 读取真正显示的页面名字
  const hash = options.section
    ? `#${options.section}`
    : options.article
      ? `#${nextRoute}:${options.article}`
      : `#${nextRoute}`; // 根据目标生成地址栏 hash

  if (currentView?.dataset.view === "home" && nextRoute !== "home") {
    finishHomeHello(); // 离开 Home 后，之后再回来就不重播 hello
  }

  views.forEach((view) => {
    view.classList.toggle("is-active", view === nextView); // 只显示当前页面，隐藏其他页面
  });

  setActiveNav(nextRoute, options.section); // 更新顶部导航状态

  if (options.updateHash !== false && window.location.hash !== hash) {
    window.history.pushState(null, "", hash); // 改地址栏，但不刷新网页
  }

  if (options.article) {
    window.setTimeout(() => revealArticle(options.article, true), 80); // 有目标项目时，打开对应项目
    return;
  }

  const activeCollection = nextView.querySelector("[data-collection]"); // 看当前页面是否有项目 collection

  if (activeCollection) {
    showCollectionItem(activeCollection, Number(activeCollection.dataset.currentIndex || 0), false); // 普通进入页面时显示当前项目
  }

  if (options.section) {
    window.setTimeout(() => {
      document.getElementById(options.section)?.scrollIntoView({ behavior: "smooth" }); // Contact 这种 Home 内区块用这里滚动
    }, 80);
    return;
  }

  window.scrollTo({ top: 0, behavior: options.updateHash === false ? "auto" : "smooth" }); // 普通切换页面时回到顶部
}

function coverOffset(index) {
  let offset = index - currentCover; // 计算这张封面离中间封面有多远
  const half = coverflowCards.length / 2; // 用总数量的一半判断是否需要循环

  if (offset > half) offset -= coverflowCards.length; // 让右侧太远的卡片绕回左侧
  if (offset < -half) offset += coverflowCards.length; // 让左侧太远的卡片绕回右侧

  return offset; // 返回相对位置
}

function showCover(index) {
  if (!coverflowCards.length) {
    return; // 没有转盘卡片时直接结束
  }

  currentCover = (index + coverflowCards.length) % coverflowCards.length; // 让封面序号可以循环

  coverflowCards.forEach((card, cardIndex) => {
    const offset = coverOffset(cardIndex); // 计算这张卡片相对中间的位置
    const distance = Math.abs(offset); // 只关心离中间有多远
    const scale = Math.max(0.58, 1 - distance * 0.11); // 越远越小
    const opacity = distance > 4 ? 0 : Math.max(0.2, 1 - distance * 0.16); // 越远越透明
    const x = offset * 138; // 控制左右展开距离
    const rotate = offset === 0 ? 0 : offset < 0 ? 54 : -54; // 左右两侧分别向内旋转

    card.style.setProperty("--x", `${x}px`); // 把左右位置交给 CSS
    card.style.setProperty("--rotate", `${rotate}deg`); // 把旋转角度交给 CSS
    card.style.setProperty("--scale", scale.toFixed(2)); // 把大小交给 CSS
    card.style.setProperty("--opacity", opacity.toFixed(2)); // 把透明度交给 CSS
    card.style.setProperty("--z", String(100 - distance)); // 离中间越近层级越高
  });

  if (coverflowTitle) {
    coverflowTitle.textContent = coverflowCards[currentCover]?.dataset.title || ""; // 更新转盘下面的标题
  }
}

function openCover(card) {
  showView(card.dataset.coverflowRoute, {
    article: card.dataset.coverflowArticle,
  }); // 打开封面对应的页面和项目
}

routeLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // 阻止浏览器默认跳转
    showView(link.dataset.route, {
      section: link.dataset.section,
    }); // 交给我们的页面切换函数处理
  });
});

collections.forEach((collection) => {
  collection.dataset.currentIndex = collection.dataset.currentIndex || "0"; // 每组项目默认从第一个开始
  showCollectionItem(collection, Number(collection.dataset.currentIndex), false); // 初始化每组项目

  collection.querySelector("[data-collection-prev]")?.addEventListener("click", () => {
    showCollectionItem(collection, Number(collection.dataset.currentIndex) - 1, false); // 点击左箭头只切项目，不拉回页面顶部
  });

  collection.querySelector("[data-collection-next]")?.addEventListener("click", () => {
    showCollectionItem(collection, Number(collection.dataset.currentIndex) + 1, false); // 点击右箭头只切项目，不拉回页面顶部
  });
});

articleOpeners.forEach((button) => {
  button.addEventListener("click", () => {
    revealArticle(button.dataset.openArticle); // 点击项目封面时滚动到项目正文
  });
});

coverflowCards.forEach((card, index) => {
  card.addEventListener("click", (event) => {
    if (event.detail !== 0) {
      return; // 鼠标点击交给 pointerup 处理，这里只保留键盘 Enter 的点击
    }

    currentCover = index; // 键盘 Enter 时先把这张卡片设为当前封面
    showCover(index); // 更新转盘位置
    openCover(card); // 打开对应项目
  });
});

coverflow?.addEventListener("pointerdown", (event) => {
  event.preventDefault(); // 阻止浏览器把封面图片当成可拖拽图片
  coverflow.setPointerCapture(event.pointerId); // 捕捉鼠标，避免拖动时丢失事件
  coverflow.classList.add("is-dragging"); // 给拖动状态加 class
  coverflowIsDragging = true; // 记录正在拖动
  coverflowPointerCard = event.target.closest("[data-coverflow-article]"); // 记录这次按下的是哪张封面
  coverflowDragStartX = event.clientX; // 记录拖动开始位置
  coverflowDragDistance = 0; // 清空旧拖动距离
});

coverflow?.addEventListener("pointermove", (event) => {
  if (!coverflowIsDragging) {
    return; // 没有拖动时不处理
  }

  coverflowDragDistance = event.clientX - coverflowDragStartX; // 计算拖动距离
});

coverflow?.addEventListener("pointerup", () => {
  coverflow?.classList.remove("is-dragging"); // 取消拖动状态
  coverflowIsDragging = false; // 记录拖动结束

  if (Math.abs(coverflowDragDistance) <= 8 && coverflowPointerCard) {
    const cardIndex = coverflowCards.indexOf(coverflowPointerCard); // 找到被点击封面在转盘里的序号

    if (cardIndex >= 0) {
      currentCover = cardIndex; // 先把这张封面设为当前封面
      showCover(cardIndex); // 更新转盘位置
      openCover(coverflowPointerCard); // 鼠标单击直接打开对应项目
    }
  }

  if (Math.abs(coverflowDragDistance) > 34) {
    showCover(currentCover + (coverflowDragDistance < 0 ? 1 : -1)); // 向左拖看下一张，向右拖看上一张
  }

  window.setTimeout(() => {
    coverflowDragDistance = 0; // 延迟清空，避免 pointerup 后 click 误触发
    coverflowPointerCard = null; // 清空这次点击到的封面
  }, 0);
});

coverflow?.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault(); // 在转盘上滚轮时，不让页面跟着滚

    if (coverflowWheelLock) {
      return; // 太短时间内不重复触发
    }

    const direction = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY; // 判断滚轮主要方向

    if (Math.abs(direction) < 4) {
      return; // 滚动太小就忽略
    }

    coverflowWheelLock = true; // 锁住一次滚轮切换
    showCover(currentCover + (direction > 0 ? 1 : -1)); // 滚轮向下/右看下一张

    window.setTimeout(() => {
      coverflowWheelLock = false; // 过一小会儿再允许下一次滚轮切换
    }, 140);
  },
  { passive: false },
);

document.addEventListener("keydown", (event) => {
  const activeCollection = document.querySelector(".view.is-active [data-collection]"); // 找到当前页面的 collection

  if (event.key === "ArrowLeft" && activeCollection) {
    showCollectionItem(activeCollection, Number(activeCollection.dataset.currentIndex) - 1, false); // 左方向键只切上一项，不拉回页面顶部
  }

  if (event.key === "ArrowRight" && activeCollection) {
    showCollectionItem(activeCollection, Number(activeCollection.dataset.currentIndex) + 1, false); // 右方向键只切下一项，不拉回页面顶部
  }
});

window.addEventListener("popstate", () => {
  openInitialHash(false); // 浏览器前进后退时按地址栏恢复页面
});

function openInitialHash(updateHash) {
  const hash = window.location.hash.slice(1); // 读取地址栏 # 后面的内容

  if (hash === "works" || hash === "contact") {
    showView("home", { section: hash, updateHash }); // #works 和 #contact 都是 Home 内部区块
    return;
  }

  const [route, article] = hash.split(":"); // 支持 #designer:architecture-design 这种地址
  showView(route || "home", { article, updateHash }); // 打开地址栏对应页面
}

showCover(0); // 初始化 Works 转盘
openInitialHash(false); // 初始化当前页面
