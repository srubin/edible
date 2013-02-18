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
            pxPerMs: .05
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
                        // update pos for the dropped waveform
                        $.each(that.options.wf, function (i, wf) {
                            if (wf.elt === $kid[0]) {
                                wf.pos = that.pxToMs($kid.position().left);
                                $.each(that.element.find('.track'), function (i, track) {
                                    if ($dad[0] === track) {
                                        wf.track = i;
                                        return false;
                                    }
                                });
                                return;
                            }
                        });
                    },
                    hoverClass: "track-drop-hover"
            });
            
            this._refresh();
        },
        
        _refresh: function () {
            console.log("timeline _refresh");
            var that = this;
            $.each(this.options.wf, function (i, wf) {
                
                that.element.find(".track:eq(" + wf.track + ")")
                    .append(wf.elt);
                $(wf.elt).css("left", that.msToPx(wf.pos))
                    .draggable({
                        containment: ".edible-timeline"
                }).waveform({
                    pxPerMs: that.options.pxPerMs,
                    changed: function () {
                        wf.pos = that.pxToMs($(wf.elt).position().left);
                    }
                }).unbind('click.edibletimeline')
                .bind('click.edibletimeline', function (event) {
                    var res = $(this).waveform("slice", event);
                    console.log("POS OF NEW WF", wf.pos + res.pos);
                    console.log("POS OF OLD WF", wf.pos);
                    that.addWaveform({
                        elt: res.waveform,
                        track: wf.track,
                        pos: wf.pos + res.pos
                    });
                    console.log("POS OF OLD WF", wf.pos);
                });
            });
            this.element.width(this.options.width);
        },

        _destroy: function () {
            
        },

        addWaveform: function (waveform, track, time) {
            this.options.wf.push(waveform);
            this._refresh();
        },

        msToPx: function (ms) {
            return ms * this.options.pxPerMs;
        },

        pxToMs: function (px) {
            return px / this.options.pxPerMs;
        },

        export: function () {
            var that = this;
            return $.map(this.options.wf, function (wf) {
                return {
                    name: $(wf.elt).waveform("option", "name"),
                    scoreStart: wf.pos / 1000.0,
                    wfStart: $(wf.elt).waveform("option", "start") / 1000.0,
                    duration: $(wf.elt).waveform("option", "len") / 1000.0
                };
            });
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
            this._refresh();
        }
        
    });

}(jQuery, window, document));
