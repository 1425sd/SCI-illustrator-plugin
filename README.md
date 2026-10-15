<div align="center">

<img width="2406" height="762" alt="image" src="https://github.com/user-attachments/assets/c719fa09-747f-452f-852e-108c0f80862a" />

</div>

# SCI Toolbox · Illustrator 科研组图插件

面向科研组图场景的 Adobe Illustrator 插件(CEP 扩展),覆盖论文排图中最费时的环节:子图编号、网格排布、对齐分布、相对位置复制、比例尺制作、局部放大图、伪彩与通道合并、科研色卡、PDF 清理、文字与线条批量修改等。

兼容 Illustrator CC 2018(22.0)及以上。

> **来源声明**
>
> - 本仓库基于原仓库 **[Achuan-2/illustrator_sci_toolbox](https://github.com/Achuan-2/illustrator_sci_toolbox)** 开发(基于原仓库截至 v2.11.0 的代码),在其基础上继续修改与维护。
> - 本插件的原作者是 **[Achuan-2](https://github.com/Achuan-2)**,特别感谢原作者的开源分享与持续维护,没有原项目就没有本仓库!
> - 原项目以 [AGPL-3.0](LICENSE) 许可证开源,本仓库同样遵循 AGPL-3.0,并保留原作者的版权与许可声明。

## 功能介绍

![功能导图](https://assets.b3logfile.com/siyuan/1610205759005/assets/mindmap-image-20261004103126-nn6sttf.png)

### 一键添加子图 label 和更新 label

![PixPin_2026-10-04_12-19-01](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_12-19-01-20261004121904-tttn1sk.png)

【**添加 label 功能介绍】**

添加子图 label 后,offset 输入框会变红,这时候修改值就会自动实时更改 label offset,还支持悬浮输入框鼠标滚轮滚动快速实时移动 label

注:要退出这个状态只需要随意点击其他按钮、输入框即可

![PixPin_2026-10-04_12-20-58](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_12-20-58-20261004122113-rr21kmx.gif)

**【更新 label 介绍】**

根据设置的样式和编号来一键更新 label 已有编号,这样子图重排、更新编号模板的时候就不需要自己一个个重写编号了

可以根据设置的 label index 编号来一个个更新,也可以批量选中所有 label 一键更新

![PixPin_2026-10-04_12-22-50](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_12-22-50-20261004122256-3eeyvqi.gif)

### 网格排布:批量调整图片宽高、一键排列整齐

![PixPin_2026-10-04_12-32-37](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_12-32-37-20261004123239-yxqmac5.png)

- **自动排布**:自动检测每行排布几个元素,初步摆放之后直接点击即可优化布局;要指定每列个数则取消勾选,手动设置列数
- **边缘对齐**:让左右边缘对齐并支持自定义宽度,程序会自动设置每行间距;每行对象数目不对齐时同样可以对齐

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260816091913-18mvx6q.png)

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260816092400-trbfp66.png)

- **对象尺寸**:保持原始尺寸 / 自动调整尺寸 / 自定义尺寸
- **排序方式**:支持按网格顺序、垂直位置、水平位置以及图层顺序确定对象顺序,默认推荐的网格顺序可综合考虑垂直与水平位置智能判断

![PixPin_2026-10-04_12-47-43](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_12-47-43-20261004124745-0tc39zs.gif)

### 复制粘贴相对位置

- 复制一个对象的相对位置时,默认以画板为参考
- 复制两个及以上对象的相对位置时,默认以第一个对象为参考;勾选「逆序」则以最后一个对象为参考点
- 跨画布统一位置时,勾选 Artboard Reference

常见使用场景:

- 先把一个形状移出去修改,再粘贴回原位置
- 一张图排版好后,把标注一键复制粘贴到其他图的相同位置
- 把一组图的排布方式瞬间套用到另一组图
- 统一多张图的 label 位置

![PixPin_2026-10-04_14-42-39](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_14-42-39-20261004144243-h3oe3ub.gif)

### 尺寸粘贴

复制一个形状的宽高或手动输入宽高,点击「粘贴尺寸」即可对选中的形状批量粘贴尺寸。宽高前的勾选框可以只选其一,如只勾选宽度,则粘贴后高度按原宽高比自动调整。

![PixPin_2026-10-04_11-04-59](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_11-04-59-20261004110511-cemx2e7.png)

### 交换两个形状的位置

- 一组图排版好后复制一份,用本功能把新图和原图替换
- 组图后需要修改时,交换两个图的位置

![PixPin_2026-10-04_11-00-55](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_11-00-55-20261004110056-d5yn0k5.png)

### 排列分布

![PixPin_2026-10-04_11-01-44](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_11-01-44-20261004110146-ythwdfj.png)

- **对齐对象**:集成水平居左、居中、居右,垂直顶对齐、居中、底对齐,以及水平垂直同时居中
- **分布对象**:按水平左边缘、中心、右边缘,或垂直顶边缘、中心、底边缘等距离分布;至少选择三个对象,两端不动,中间对象只沿对应方向移动
- **等间距分布**:一键统一不同宽高形状之间的水平 / 垂直间距

  ![水平间距均匀分布-20251128204458-56dc2da](https://assets.b3logfile.com/siyuan/1610205759005/assets/network-asset-971991ff-cec1-4488-b862-26534e445522-20260114181252-z98cqc7.gif)

- **间距复制粘贴**:官方的分布间距只能指定值而不能获取值;已经排好的间距可以一键复制,批量应用到其他形状

  ![复制粘贴间距-20251128205250-r9vjwbw](https://assets.b3logfile.com/siyuan/1610205759005/assets/network-asset-0567f2aa-6a3c-4757-9ffd-f1fc3cf12d58-20260114181253-dzomi3s.gif)

### 一键添加图片边框

![PixPin_2026-10-04_11-03-47](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_11-03-47-20261004110349-m5b6n5v.png)

### 添加伪彩和合并通道

支持给图片上伪彩(红、绿、蓝、青、品红、黄、灰度)以及多通道图片合并。

![PixPin_2026-10-04_10-32-21](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-32-21-20261004103223-dm2pkd4.png)

![PixPin_2026-10-04_10-41-12](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-41-12-20261004104114-7c9h3p9.png)

### 制作比例尺 scalebar

设置图片 FOV 信息后可以制作比例尺,tif 自带 FOV 信息时插件会自动读取;多张图片 FOV 一致时可同时制作。

比例尺支持横向 Width / 纵向 Height、厚度(pt)、颜色、文字显示、字体颜色、字号、加粗和四角位置,默认与图片编组。

![PixPin_2026-10-04_10-42-50](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-42-50-20261004104256-b8zpcz3.png)

![PixPin_2026-10-04_10-49-48](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-49-48-20261004104955-np2yv8z.png)

### 制作放大图

点击「制作放大图」打开弹窗,鼠标左键框选放大区域即可制作;可设置放大矩形样式、辅助线样式、放大图样式。原图已有比例尺时,放大图也会自动带比例尺。

- 支持批量制作:多张图要放大的区域一致时,可同时选中多张图批量设置
- 支持自动更新:移动原图、放大矩形或放大图,都会自动重新制作

![PixPin_2026-10-04_15-49-45](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_15-49-45-20261004154948-8ywookj.png)

![PixPin_2026-10-04_10-58-22](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-58-22-20261004105826-6hl5cnj.png)

### 色卡功能

默认提供「期刊配色、分类配色、连续配色、发散配色」四个分组,内置 23 套常用科研配色,支持自定义分组和新增色卡。

左键点击颜色为所选形状直接应用填充色,右键点击复制 HEX 或 RGB 值。

![PixPin_2026-10-04_10-45-08](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-45-08-20261004104510-42jnfuo.png)

### 文字与线条处理

- **拆分 / 合并文本**:把一个文本对象里空格分隔的多段内容拆成独立对象(按原位置摆放),或把多个对象按阅读顺序合并成一个,互为逆操作
- **修改文字**:把选中的文本对象(含组内)批量改为指定字体和字号,可与设置的默认值双向同步
- **修改线条**:把选中对象内的路径(含组内、复合路径内部)线宽统一为所选值

### 选择工具

- **选择筛选**:从当前选区中筛选文本 / 路径(线条)/ 形状(封闭路径),支持「反向筛选」选中不匹配类型的其余对象
- **交换位置**:九宫格参考点一键交换两个对象位置

### PDF / 图片工具

- **PDF 清理**:选中导入的 PDF 顶层组一键清理——删除白色背景与无用路径(「删除白色路径」可勾选)、可选删除白色文字、文字改 Arial、释放蒙版、取消编组、嵌入置入图,并显示删除明细
- **修改图片比例**:输入目标宽高比,选择保持高度或宽度,批量修改图片宽高

## 如何安装、使用本插件

### 下载 zip 或 zxp 文件

**下载地址**:

- 本仓库 Releases:[https://github.com/1425sd/SCI-illustrator-plugin/releases](https://github.com/1425sd/SCI-illustrator-plugin/releases)(v2.11.0 起提供 ZXP / ZIP 安装包下载)
- 原仓库 Releases(历史版本):[https://github.com/Achuan-2/illustrator_sci_toolbox/releases](https://github.com/Achuan-2/illustrator_sci_toolbox/releases)
- 网盘下载(原仓库分享):[百度网盘](https://pan.baidu.com/s/1zRVdx0TtWFCZi0rwfZkUBw?pwd=ftit) / [夸克网盘](https://pan.quark.cn/s/12bf0d38de47)

### 安装方法

#### 【方法一: zxp 文件安装】

下载 zxp 文件后,安装 [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/),打开软件把 zxp 文件拖进去即可安装(ZXP/UXP Installer 也可从上述网盘下载,安装时只需勾选 ZXP/UXP installer 和同意许可条款)

![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20261004102229-velq1hh.png)

![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20261004102245-4mndxv7.png)

点击 File 选择下载的 zxp 文件进行安装

![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20261004102308-q3l687w.png)

![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20261004102318-9bddu55.png)

> 如果软件没有找到 illustrator 版本,可以不管,点击确定继续安装

安装成功

![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20261004102328-kb9oayh.png)

安装后记得重启 illustrator!!!

#### 【方法二: zip 文件安装】

ZIP 与 ZXP 内容相同,仅扩展名不同。下载 ZIP 后解压为文件夹,将整个文件夹复制到 Adobe 插件目录,安装后重启 Illustrator。

- Windows:按 `Win+R` 输入 `%APPDATA%\Adobe\CEP\extensions` 并回车
- MacOS:`~/Library/Application Support/Adobe/CEP/extension`

![PixPin_2026-10-04_10-24-56](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-24-56-20261004102458-6tvoae2.png)

#### 设置 PlayerDebugMode(如果能正常使用可跳过)

如果打开插件后显示页面空白,需要设置 PlayerDebugMode 才能使用本插件

- **Windows**:`Win+R` 输入 `regedit` 打开注册表,找到 `计算机\HKEY_CURRENT_USER\Software\Adobe\` 下的 `CSXS.版本号` 文件夹(可在地址栏直接粘贴跳转),右键新建【字符串值】,名称为 `PlayerDebugMode`,值为 `1`。如果 CSXS 有多个版本,每个版本都要创建

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/network-asset-9d2e4b7d-201b-48e6-95ea-4dc02bdf0986-20260114181242-hc1pnup.png)

- **MacOS**:打开终端输入(不知道版本号可以把 4 到 12 都设置一遍)

  ```bash
  defaults write com.adobe.CSXS.12 PlayerDebugMode 1
  ```

### 打开插件

- 点击「窗口 - 扩展」,点击本插件即可打开

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20260114180745-iub6hwf.png)

- 窗口可以拖拽到侧栏方便使用

  ![PixPin_2026-10-04_10-29-42](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2026-10-04_10-29-42-20261004102943-qz0zsoj.png)

## 本地开发

项目架构为 Bolt CEP + Svelte + TypeScript,使用 pnpm 管理依赖。

```bash
pnpm install
pnpm build  # 检查并生成静态页面,完成后退出,不依赖开发服务
pnpm dev    # 直接启动或复用热更新服务,首次自动生成扩展文件
pnpm zxp    # 生成静态扩展、签名 ZXP,并自动复制为 ZIP
```

## 相关链接

- 原仓库:[Achuan-2/illustrator_sci_toolbox](https://github.com/Achuan-2/illustrator_sci_toolbox)(英文说明见原作者撰写的 [README_EN.md](README_EN.md))
- 原作者博客(插件介绍与教程):
  - [论文排图太累,于是我写了一个 adobe illustrator 插件](https://zhuanlan.zhihu.com/p/1949230421322731895)
  - [科研组图丨我宣布,我实现了 illustrator 添加子图编号的极致便捷体验](https://www.zhihu.com/zvideo/1951806163646648639)
  - [我的 illustrator 插件更新:科研拼图添加子图 label 更丝滑了](https://zhuanlan.zhihu.com/p/1954137741576110932)
  - [我的 illustrator 科研组图插件更新:新增间距均匀分布和复制粘贴间距功能](https://zhuanlan.zhihu.com/p/1977179470931710030)
  - [illustrator 科研组图插件 SCI Toolbox v2.3.0 更新:添加图片边框功能、子图交换位置功能增强](https://zhuanlan.zhihu.com/p/1982893231982265842)
  - [Illustrator 科研组图插件更新 v2.4.0:网格布局体验大大优化](https://zhuanlan.zhihu.com/p/2072258459060458209)
  - [illustrator 科研组图插件 v2.5.0 大更新:支持伪彩、合并通道、添加比例尺、色卡功能](https://zhuanlan.zhihu.com/p/2090110566908147527)

## ❤️ 支持原作者

开源与创作不易,如果这个插件对你有帮助,欢迎赞赏支持原作者 [Achuan-2](https://github.com/Achuan-2) 的持续开发与维护(下方为原作者的赞赏码)。

<img alt="赞赏码" src="https://assets.b3logfile.com/siyuan/1610205759005/assets/network-asset-image-20250614123558-fuhir5v.png" />
