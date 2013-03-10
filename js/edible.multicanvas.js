// MultiCanvas and MultiContext
// This allows canvases to extend past the browser-defined
// width limit, while still treating the canvas like normal.

var EDIBLE = EDIBLE || {};

EDIBLE.namespace = function (ns_string) {
    var parts = ns_string.split('.');
    var parent = EDIBLE;
    var i;
    
    // strip redundant leading global
    if (parts[0] === "EDIBLE") {
        parts = parts.lice(1);
    }
    
    for (i = 0; i < parts.length; i += 1) {
        // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

EDIBLE.namespace('modules.multiCanvas');
EDIBLE.namespace('modules.multiContext');

// module with constructor pattern
EDIBLE.modules.MultiContext = (function () {
    
    var updateContexts = function () {
        this.contexts = this.canvas.canvases.map(function (canv) {
            return canv.getContext('2d');
        });

        if (this._fillStyle !== undefined) {
            this.fillStyle = this._fillStyle;            
        }
        if (this._strokeStyle !== undefined) {
            this.strokeStyle = this._strokeStyle;
        }
        if (this._lineWidth !== undefined) {
            this.lineWidth = this._lineWidth;
        }
        
        this._position = {
            ctx: this.contexts[0],
            x: 0,
            y: 0,
            gx: 0,
            gy: 0
        }
        
    };
    
    var pointInContext = function (x, y, c_i) {
        var ctx = this.contexts[c_i];
        var left = c_i * this._maxWidth;
        var right = left + this._maxWidth;
        if (c_i === this.contexts.length - 1) {
            right = left + this.canvas.canvases[c_i].width;
        }
                
        if (x >= left && x < right) {
            return x - left;
        }
        return undefined;
    };
    
    var rectFuncFactory = function (funcName) {
        return function (x, y, width, height) {
            var i, lPt;
            var left = false;
            for (i = 0; i < this.contexts.length; i += 1) {
                lPt = this._pointInContext(x, y, i);
                rPt = this._pointInContext(x + width, y, i);
                
                if (lPt !== undefined && rPt !== undefined) {
                    this.contexts[i][funcName](lPt, y, width, height);
                    break;
                }
                
                if (lPt !== undefined) {
                    this.contexts[i][funcName](lPt, y,
                        this._maxWidth - lPt, height);
                    left = true;
                } else if (rPt !== undefined) {
                    this.contexts[i][funcName](0, y, rPt, height);
                    break;
                } else if (left) {
                    this.contexts[i][funcName](0, y, this._maxWidth, height);
                } 
            }
        }
    };
    
    var propSetter = function (propName) {
        return function (val) {
            var i;
            this['_' + propName] = val;
            if (val instanceof Array) {
                for (i = 0; i < this.contexts.length; i += 1) {
                    this.contexts[i][propName] = val[i];
                }
            } else {
                for (i = 0; i < this.contexts.length; i += 1) {
                    this.contexts[i][propName] = val;
                }

            }
            return val;
        }

    };
    
    var propGetter = function (propName) {
        return function () {
            return this['_' + propName];
        }
    };
    
    var universalFunc = function (funcName) {
        return function () {
            this.contexts.forEach(function (ctx) {
                ctx[funcName]();
            })
        };
    };
     
    // public API -- constructor
    MultiContext = function (mcanv, maxWidth) {
        var i;
        this.canvas = mcanv;
        this._maxWidth = maxWidth;
        this._updateContexts = updateContexts.bind(this);
        this._pointInContext = pointInContext.bind(this);
        this._updateContexts();
        this._position = {
            ctx: this.contexts[0],
            x: 0,
            y: 0,
            gx: 0,
            gy: 0
        }
    };
    
    // public API -- prototype
    MultiContext.prototype = {
        constructor: EDIBLE.modules.MultiContext,
        version: '0.1',
        
        createLinearGradient: function (x1, y1, x2, y2) {
            var i;
            var linearGradients = [];

            linearGradients = this.contexts.map(function (ctx) {
                return ctx.createLinearGradient(x1, y1, x2, y2);
            });

            linearGradients.addColorStop = function (position, color) {
                this.map(function (linGrad) {
                    linGrad.addColorStop(position, color);
                })
            };
            
            return linearGradients;
        }
    }
    
    var universals = ["save", "restore", "closePath", "beginPath", "stroke"];
    
    universals.forEach(function (univ) {
        MultiContext.prototype[univ] = universalFunc(univ);
    });
    
    var rectFuncs = ["clearRect", "strokeRect", "fillRect", "rect"];
    
    rectFuncs.forEach(function (rf) {
        MultiContext.prototype[rf] = rectFuncFactory(rf);
    });
    
    var moveTo = function (x, y) {
        var i;
        for (i = 0; i < this.contexts.length; i++) {
            pt = this._pointInContext(x, y, i);
            if (pt !== undefined) {
                this._position = {
                    ctx: this.contexts[i],
                    x: pt,
                    y: y,
                    gx: x,
                    gy: y
                };
                this.contexts[i].moveTo(pt, y);
            }
        }
    };
    
    var lineTo = function (x, y) {
        var i;
        var ctx;
        var offset = 0;
        for (i = 0; i < this.contexts.length; i++) {
            ctx = this.contexts[i]
            pt = this._pointInContext(x, y, i);
            if (pt !== undefined && ctx === this._position.ctx) {
                ctx.lineTo(pt, y);
                this._position = {
                    ctx: ctx,
                    x: pt,
                    y: y,
                    gx: x,
                    gy: y
                };
                break;
            }
            
            if (pt !== undefined && x < this._position.gx) {
                // line to the left
                m = (y - this._position.gy) / parseFloat(x - this._position.gx);
                var f = function (_x) { return m * (_x - x) + y };
                
                var newPos = {
                    ctx: ctx,
                    x: pt,
                    y: y,
                    gx: x,
                    gy: y
                };
                
                while (i < this.contexts.indexOf(this._position.ctx)) {
                    newY = f(offset + this.canvas.canvases[i].width);
                    ctx.moveTo(this.canvas.canvases[i].width, newY);
                    ctx.lineTo(pt, y);
                    pt = 0;
                    y = newY;
                    offset += this.canvas.canvases[i].width;
                    i += 1;
                    ctx = this.contexts[i];
                }
                
                this._position.ctx.lineTo(pt, y);
                
                this._position = newPos;
                break;
            }
            
            if (pt !== undefined && x > this._position.gx) {
                // line to the right
                console.log("line to the right");
                m = (y - this._position.gy) / parseFloat(x - this._position.gx);
                console.log("slope", m);
                var f = function (_x) { return m * (_x - x) + y };
                
                var newPos = {
                    ctx: ctx,
                    x: pt,
                    y: y,
                    gx: x,
                    gy: y
                };
                
                while (i > this.contexts.indexOf(this._position.ctx)) {
                    newY = f(offset);
                    console.log("ctx", i, "moveto", 0, newY, "lineto", pt, y);
                    ctx.moveTo(0, newY);
                    ctx.lineTo(pt, y);
                    pt = this.canvas.canvases[i - 1].width;
                    y = newY;
                    offset -= this.canvas.canvases[i - 1].width;
                    i -= 1;
                    ctx = this.contexts[i];
                }
                
                this._position.ctx.lineTo(pt, y);
                
                this._position = newPos;
                break;
            }
            
            offset += this.canvas.canvases[i].width;
        }
    };
    
    MultiContext.prototype.moveTo = moveTo;
    MultiContext.prototype.lineTo = lineTo;
    
    var props = ["fillStyle", "font", "globalAlpha", "globalCompositeOperation", 
                 "lineCap", "lineDashOffset", "lineJoin", "lineWidth",
                 "miterLimit", "shadowBlur", "shadowColor", "shadowOffsetX",
                 "shadowOffsetY", "strokeStyle", "textAlign", "textBaseline"];
    
    props.forEach(function (prop) {
        MultiContext.prototype.__defineSetter__(prop, propSetter(prop));
        MultiContext.prototype.__defineGetter__(prop, propGetter(prop));
    });
    
    return MultiContext;

}());

EDIBLE.modules.MultiCanvas = (function () {
    
    // public API -- constructor
    MultiCanvas = function (o, maxW) {
        if (maxW !== undefined) {
            this._maxWidth = parseFloat(maxW);
        } else {
            this._maxWidth = 30000.0;
        }
        this.canvases = [o];
        this.mctx = new EDIBLE.modules.MultiContext(this, this._maxWidth);
    };
    
    // public API -- prototype
    MultiCanvas.prototype = {
        constructor: EDIBLE.modules.MultiCanvas,
        version: '0.1',
        
        clone: function (mc) {
            this.width = mc.width;
            this.height = mc.height;
            var i;
            var ctx;
            for (i = 0; i < mc.canvases.length; i++) {
                // copy each canvas
                ctx = this.canvases[i].getContext('2d');
                ctx.drawImage(mc.canvases[0], 0, 0,
                    mc.canvases[0].width, mc.canvases[0].height)
            }
        },
        
        destroy: function () {
            var i;
            var parent = this.canvases[0].parentNode;
            for (i = 0; i < this.canvases.length; i++) {
                parent.removeChild(this.canvases[i]);
            }
        },
        
        getContext: function (val) {
            if (val === '2d') {
                return this.mctx;
            } else {
                throw "Only '2d' contexts are supported."
            }
        },
        
        get height () {
            return this._height;
        },
        
        set height (height) {
            var i;
            for (i = 0; i < this.canvases.length; i++) {
                this.canvases[i].height = height;
            }
            this._height = height;
            return height;
        },
        
        get width () {
            return this._width;
        },
        
        set width (width) {
            var i;
            var newCanv;
            var nCanvs = parseInt(width / this._maxWidth + 1);
            var parent = this.canvases[0].parentNode;
            
            for (i = 0; i < this.canvases.length; i += 1) {
                parent.removeChild(this.canvases[i]);
            }
            this.canvases = this.canvases.slice(0,1);
            this.canvases = [];
            
            for (i = 0; i < nCanvs; i += 1) {
                if (i >= this.canvases.length) {
                    newCanv = document.createElement("canvas");
                    newCanv.height = this._height;
                    newCanv.style.display = "inline-block";
                    parent.appendChild(newCanv);
                    this.canvases.push(newCanv);
                }
                if (i === nCanvs - 1) {
                    this.canvases[i].width =
                        width - this._maxWidth * (nCanvs - 1);
                } else {
                    this.canvases[i].width = this._maxWidth;
                }
            }
            this._width = width;
            this.mctx._updateContexts();
            return width;  
        }
    };
    
    return MultiCanvas;
    
}());