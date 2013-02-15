/*jslint browser: true nomen: true devel: true vars: true */
/*global jQuery, _ */

/*!
 * timeline
 * part of edible in-browser media timeline
 * this is a container widget that contains several waveforms
 * Author: Steve Rubin
 */

(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.timeline", {
        options: {
            width: "1200px",
            tracks: 4,
            wf: [],
            pxPerMs: .01
        },
        
        msToPx: function (ms) {
            return ms * this.options.pxPerMs;
        },
        
        pxToMs: function (px) {
            return px / this.options.pxPerMs;
        },
        
        _create: function () {
            console.log("in timeline _create");
            var that = this;
            var trackTemplate = $("#trackTemplate").html();
            var i;
            this.element.addClass("edible-timeline")
            for (i = 0; i < this.options.tracks; i++) {
                this.element.append(_.template(trackTemplate));
            }
            this.element.find(".track").each(function (index) {
                $(this).css("top", 95 * index + "px");
            }).droppable({
                    accept: ".edible-waveform",
                    drop: function (event, ui) {
                        var $kid = ui.draggable;
                        var $dad = $(this);
                        if ($kid.parent() !== $dad) {
                            $kid.appendTo($dad);
                            $kid.css('top', 0);
                        }
                        // update start for the dropped waveform
                        $.each(that.options.wf, function (i, wf) {
                            if (wf.elt === $kid[0]) {
                                wf.start = that.pxToMs($kid.position().left);
                                return;
                            }
                        });
                    },
                    hoverClass: "track-drop-hover"
            });
            console.log("wf iter");
            $.each(this.options.wf, function (i, wf) {
                that.element.find(".track:eq(" + wf.track + ")")
                    .append(wf.elt);
                $(wf.elt).css("left", that.msToPx(wf.start))
                    .draggable({
                        containment: ".edible-timeline"
                    });
            })
            
            this._refresh();
        },
        
        _refresh: function () {
            var that = this;
            $.each(this.options.wf, function (i ,wf) {
                $(wf.elt).waveform("option", "pxPerMs", that.options.pxPerMs);
            });
            this.element.width(this.options.width);
        },
        
        _destroy: function () {
            
        },
        
        addWaveform: function (waveform, track, time) {
            this.options.wf.push(waveform);
            this._refresh();
        },
        
        
        
        _setOptions: function () {
            // _super and _superApply handle keeping the right this-context
            this._superApply(arguments);
            this._refresh();
        },
        
        _setOption: function (key, value) {
            console.log("in _setOption with key:", key, "value:", value);
            switch (key) {
            case "oogielove":
                break;
            default:
                this.options[key] = value;
                break;
            }
            
            this._super("_setOption", key, value);
        }
        
    });

}(jQuery, window, document));
