import { Container } from "./container";
import { Measure } from "../measure";
import { Control } from "./control";

/**
 * Class used to create a 2D stack panel container
 */
export class StackPanel extends Container {
    private _isVertical = true;
    private _manualWidth = false;
    private _manualHeight = false;
    private _doNotTrackManualChanges = false;

    /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
    public get isVertical(): boolean {
        return this._isVertical;
    }

    public set isVertical(value: boolean) {
        if (this._isVertical === value) {
            return;
        }

        this._isVertical = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets panel width.
     * This value should not be set when in horizontal mode as it will be computed automatically
     */
    public set width(value: string | number) {
        if (!this._doNotTrackManualChanges) {
            this._manualWidth = true;
        }

        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._markAsDirty();
        }
    }

    public get width(): string | number {
        return this._width.toString(this._host);
    }

    /**
     * Gets or sets panel height.
     * This value should not be set when in vertical mode as it will be computed automatically
     */
    public set height(value: string | number) {
        if (!this._doNotTrackManualChanges) {
            this._manualHeight = true;
        }

        if (this._height.toString(this._host) === value) {
            return;
        }

        if (this._height.fromString(value)) {
            this._markAsDirty();
        }
    }

    public get height(): string | number {
        return this._height.toString(this._host);
    }

    /**
     * Creates a new StackPanel
     * @param name defines control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "StackPanel";
    }

    /** @hidden */
    protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        for (var child of this._children) {
            if (this._isVertical) {
                child.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            } else {
                child.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            }
        }

        super._preMeasure(parentMeasure, context);
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.copyFrom(parentMeasure);
        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;
    }

    protected _postMeasure(): void {
        var stackWidth = 0;
        var stackHeight = 0;
        for (var child of this._children) {
            if (!child.isVisible || child.notRenderable) {
                continue;
            }

            if (this._isVertical) {
                child.top = stackHeight + "px";
                if (!child._top.ignoreAdaptiveScaling) {
                    child._markAsDirty();
                }
                child._top.ignoreAdaptiveScaling = true;
                stackHeight += child._currentMeasure.height;
                if (child._currentMeasure.width > stackWidth) {
                    stackWidth = child._currentMeasure.width;
                }
            } else {
                child.left = stackWidth + "px";
                if (!child._left.ignoreAdaptiveScaling) {
                    child._markAsDirty();
                }
                child._left.ignoreAdaptiveScaling = true;
                stackWidth += child._currentMeasure.width;
                if (child._currentMeasure.height > stackHeight) {
                    stackHeight = child._currentMeasure.height;
                }
            }
        }

        this._doNotTrackManualChanges = true;

        // Let stack panel width and height default to stackHeight and stackWidth if dimensions are not specified.
        // User can now define their own height and width for stack panel.

        let panelWidthChanged = false;
        let panelHeightChanged = false;

        let previousHeight = this.height;
        let previousWidth = this.width;

        if (!this._manualHeight) {
            // do not specify height if strictly defined by user
            this.height = stackHeight + "px";
        }
        if (!this._manualWidth) {
            // do not specify width if strictly defined by user
            this.width = stackWidth + "px";
        }

        panelWidthChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;
        panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;

        if (panelHeightChanged) {
            this._height.ignoreAdaptiveScaling = true;
        }

        if (panelWidthChanged) {
            this._width.ignoreAdaptiveScaling = true;
        }

        this._doNotTrackManualChanges = false;

        if (panelWidthChanged || panelHeightChanged) {
            this._rebuildLayout = true;
        }

        super._postMeasure();
    }
}