export const config = {
  owner: <string>'bloniea',
  repo: <string>'images-bed',

  // https://cdn.jsdelivr.net/gh/bloniea/images-bed/images1/1a9961425572ebe7.jpg

  url: <string>'https://images.bloniea.com/', // 图片地址前缀
  title: 'bloniea 姉さま的图床',
  loading_url: 'https://images.bloniea.com//images/web/loading_1717925494545_781.gif', // 页面的load gif图片
  default_avatar: 'https://images.bloniea.com/images/web/_1717925180824_349.png',
  maxsize: 20, // 支持的图片大小,单位mb
  maxLen: 8, //单次最多选择的图片数量
  path: 'images', // 存放仓库的原图路径
  thumbnailPath: 'imagesThumbnail', // 存放仓库的缩略图路径
  message: 'image upload', // github 的message信息
  avatar: 'https://images.bloniea.com//images/web/_1717925124500_918.png',
  defaultCategoryId: 1,
  copyright: `©2023-${new Date().getFullYear()} bloniea. All rights reserved.`,
  subsectionSize: 4, //分段上传,每段大小,单位mb
  timeout: 180000, //请求超时时间,单位毫秒
  retry: 4 //请求失败重试次数
}
