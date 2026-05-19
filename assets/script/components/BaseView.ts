/**
 * BaseView.ts
 * 所有UI视图的基类（参考货柜归位大闯关的BaseView）
 */

import {
    _decorator, Component, Node, Enum, v3, tween, Widget,
    Sprite, BlockInputEvents, Color, UITransform, EventTouch,
    Button, view, size, easing
} from 'cc';
import { App } from '../App';
import { EventName } from '../const/EventName';

const { ccclass, property } = _decorator;

export enum WindowType {
    eView = 1,
    eTips = 2,
    eToast = 3,
    eLoading = 4,
}

export enum WindowOpenType {
    /** 同时只能存在一个 */
    eSingle = 1,
    /** 可以多个同时存在 */
    eMultiple = 2,
}

const CLICK_WAIT_TIME = 0;

@ccclass("BaseView")
export class BaseView extends Component {

    /** 窗口类型 */
    @property({ type: Enum(WindowType) })
    viewType: WindowType = WindowType.eView;

    /** 打开类型 */
    @property({ type: Enum(WindowOpenType) })
    viewOpenType: WindowOpenType = WindowOpenType.eSingle;

    /** 是否添加全屏适配Widget */
    @property()
    isAddFullWidget: boolean = true;

    /** 是否遮罩 */
    @property()
    isMask: boolean = false;

    /** 点击空白是否关闭 */
    @property()
    isTouchSpaceClose: boolean = false;

    /** 是否播放打开动画 */
    @property()
    isPlayOpenAnim: boolean = true;

    /** 节点映射表 */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    private maskPanel: Node | null = null;
    private closeCallBack: Function | null = null;
    protected extraData: any = null;

    protected onLoad(): void {
        // 节点遍历
        this.selectChild(this.node);

        // 打开动画
        if (this.isPlayOpenAnim) {
            this.openAnim();
        }

        // 全屏Widget
        if (this.isAddFullWidget) {
            this.addFullWidget();
        }

        // 遮罩
        if (this.isMask) {
            this.addMask();
        }

        // 空白点击
        if (this.isTouchSpaceClose) {
            this.addSpaceEvent();
        }

        this.addEvents();
    }

    protected addEvents(): void {
        // 子类重写
    }

    /**
     * 加载额外数据（openView时传入）
     */
    public loadExtraData(...args: any): void {
        this.extraData = args;
    }

    /**
     * 设置关闭回调
     */
    public setCloseFunc(callback: Function): void {
        this.closeCallBack = callback;
    }

    /**
     * 窗口关闭时调用
     */
    public onClose(): void {
        if (this.closeCallBack) {
            this.closeCallBack.call(this, this);
        }
        if (this.node) {
            this.node.removeFromParent();
            this.destroy();
        }
    }

    /**
     * 默认关闭按钮（子类可重写）
     */
    protected onClick_closeBtn(): void {
        this.closeSelf();
    }

    protected closeSelf(): void {
        const viewName = this.node["viewName"];
        if (viewName) {
            App.view.closeView(viewName);
        } else {
            this.onClose();
        }
    }

    protected onDestroy(): void {
        App.event.offAll(this);
    }

    /**
     * 打开动画
     */
    protected openAnim(cb?: Function): void {
        const animNode = this.viewList.get('animNode') || this.node;
        animNode.scale = v3(0, 0, 0);
        tween(animNode)
            .to(0.2, { scale: v3(1, 1, 1) }, { easing: easing.backOut })
            .call(() => cb && cb())
            .start();
    }

    /**
     * 添加全屏Widget
     */
    protected addFullWidget(): void {
        const widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.top = 0;
        widget.isAlignBottom = true;
        widget.bottom = 0;
        widget.isAlignLeft = true;
        widget.left = 0;
        widget.isAlignRight = true;
        widget.right = 0;
        widget.alignMode = 2; // ON_WINDOW_RESIZE
    }

    /**
     * 添加遮罩层
     */
    protected addMask(): void {
        const maskNode = new Node('Mask');
        maskNode.layer = this.node.layer;
        maskNode.addComponent(UITransform).setContentSize(1280, 720);
        const sprite = maskNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SLICED;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(0, 0, 0, 180);

        this.node.addChild(maskNode);
        maskNode.setSiblingIndex(-1);
        this.maskPanel = maskNode;

        maskNode.addComponent(BlockInputEvents);
    }

    /**
     * 添加空白点击事件
     */
    protected addSpaceEvent(): void {
        if (!this.maskPanel) return;
        this.maskPanel.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            if (event.target === this.maskPanel) {
                this.onClick_closeBtn();
            }
        });
    }

    /**
     * 遍历所有子节点，建立映射
     * 命名规范：按钮命名为 Btn_xxx，图片命名为 Img_xxx，文本命名为 Label_xxx
     */
    private selectChild(node: Node, path: string = ''): void {
        const stack: [Node, string][] = [[node, path]];

        while (stack.length > 0) {
            const [curNode, curPath] = stack.pop()!;

            const fullPath = curPath ? `${curPath}/${curNode.name}` : curNode.name;
            this.viewList.set(fullPath, curNode);

            // 绑定按钮事件
            this.bindButton(curNode);

            // 遍历子节点
            for (let i = curNode.children.length - 1; i >= 0; i--) {
                const child = curNode.children[i];
                stack.push([child, fullPath]);
            }
        }
    }

    /**
     * 绑定按钮（命名规范 Btn_xxx）
     * 子类实现 onClick_xxx 即可响应点击
     */
    private bindButton(node: Node): void {
        const btn = node.getComponent(Button);
        if (!btn) return;

        // 通过命名约定自动绑定
        const name = node.name;
        if (name.startsWith('Btn_')) {
            const methodName = 'onClick_' + name;
            if (typeof (this as any)[methodName] === 'function') {
                btn.clickEvents = [];
                const eventHandler = new Component.EventHandler();
                eventHandler.target = this.node;
                eventHandler.component = '';
                eventHandler.handler = methodName;
                btn.clickEvents.push(eventHandler);
            }
        }
    }

    /**
     * 获取节点（通过路径）
     */
    protected getNode(path: string): Node | undefined {
        return this.viewList.get(path);
    }
}
