/**
 * UIHelper.ts
 * 代码创建UI节点的工具（用于动态搭建界面）
 */

import {
    Node, UITransform, Sprite, SpriteFrame, Label, Color,
    Button, Widget, Layout, UIOpacity, Vec3, size
} from 'cc';

export class UIHelper {

    /**
     * 创建一个带UITransform的节点
     */
    static createNode(name: string, w: number, h: number, parent?: Node): Node {
        const node = new Node(name);
        node.layer = 1; // UI_2D
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, h);
        if (parent) parent.addChild(node);
        return node;
    }

    /**
     * 创建纯色Sprite节点
     */
    static createColorNode(name: string, w: number, h: number, color: Color, parent?: Node): Node {
        const node = UIHelper.createNode(name, w, h, parent);
        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = color;
        return node;
    }

    /**
     * 创建SpriteFrame节点
     */
    static createSpriteNode(name: string, sf: SpriteFrame, parent?: Node): Node {
        const node = UIHelper.createNode(name, sf.width || 100, sf.height || 100, parent);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = sf;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        return node;
    }

    /**
     * 创建标签
     */
    static createLabel(name: string, text: string, fontSize: number, color?: Color, parent?: Node): Node {
        const node = UIHelper.createNode(name, 200, 40, parent);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color || new Color(255, 255, 255, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.isBold = true;
        return node;
    }

    /**
     * 创建纯色按钮
     */
    static createButton(name: string, w: number, h: number, bgColor: Color, text: string, fontSize: number, parent?: Node): Node {
        const node = UIHelper.createColorNode(name, w, h, bgColor, parent);
        node.addComponent(Button);

        const label = UIHelper.createLabel('Label', text, fontSize, Color.WHITE, node);
        label.setPosition(0, 0, 0);
        // 让Label填满按钮
        const labelTransform = label.getComponent(UITransform)!;
        labelTransform.setContentSize(w, h);

        return node;
    }

    /**
     * 创建带SpriteFrame的按钮
     */
    static createImageButton(name: string, normalSF: SpriteFrame, parent?: Node): Node {
        const w = normalSF.width || 100;
        const h = normalSF.height || 100;
        const node = UIHelper.createSpriteNode(name, normalSF, parent);
        node.addComponent(Button);
        return node;
    }

    /**
     * 设置节点位置
     */
    static setPosition(node: Node, x: number, y: number, z?: number): void {
        node.setPosition(x, y, z || 0);
    }

    /**
     * 设置Widget全屏
     */
    static setWidgetFull(node: Node): Widget {
        const widget = node.getComponent(Widget) || node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.top = 0;
        widget.isAlignBottom = true;
        widget.bottom = 0;
        widget.isAlignLeft = true;
        widget.left = 0;
        widget.isAlignRight = true;
        widget.right = 0;
        widget.alignMode = 2;
        return widget;
    }

    /**
     * 设置Widget锚定到顶部
     */
    static setWidgetTop(node: Node, top: number = 0): Widget {
        const widget = node.getComponent(Widget) || node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.top = top;
        widget.isAlignLeft = true;
        widget.left = 0;
        widget.isAlignRight = true;
        widget.right = 0;
        return widget;
    }

    /**
     * 设置Widget锚定到底部
     */
    static setWidgetBottom(node: Node, bottom: number = 0): Widget {
        const widget = node.getComponent(Widget) || node.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.bottom = bottom;
        widget.isAlignLeft = true;
        widget.left = 0;
        widget.isAlignRight = true;
        widget.right = 0;
        return widget;
    }

    /**
     * 创建触摸遮罩（全屏透明，接收触摸）
     */
    static createTouchZone(name: string, parent: Node): Node {
        const node = UIHelper.createNode(name, 720, 1280, parent);
        UIHelper.setWidgetFull(node);
        return node;
    }
}
