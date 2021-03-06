/*jslint browser: true nomen: true devel: true vars: true */
/*global jQuery, _ */

/*!
 * timeline
 * part of edible in-browser media timeline
 * this is a container widget that contains several waveforms
 * Author: Steve Rubin
 */


;(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.timeline", {
        options: {
            width: "1200px",
            tracks: 4,
            wf: [],
            _dirtyWaveforms: [],
            pxPerMs: .05,
            sound: undefined,
            position: 0.0,
            clickMode: "volume",
            linkGroups: [],
            _dirty: true
        },
        
        _create: function () {
            var that = this;
            console.log("in timeline _create");
            
            var trackTemplate = $("#trackTemplate").html();
            var i;
            this.element.addClass("edible-timeline");
            for (i = 0; i < this.options.tracks; i++) {
                this.element.append(_.template(trackTemplate));
            }
            this.element.css("height", this.options.tracks * 95 + "px");
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
                                var oldpos = wf.pos;
                                wf.pos = that.pxToMs($kid.position().left);
                                var deltapos = wf.pos - oldpos;
                                var deltapx = that.msToPx(deltapos);
                                $.each(that.element.find('.track'), function (i, track) {
                                    if ($dad[0] === track) {
                                        wf.track = i;
                                        return false;
                                    }
                                });
                                // TOO MUCH NESTING. NO TIME TO CLEAN :-(
                                // update link group wfs too (in any)
                                $.each(that.options.linkGroups, function (j, lg) {
                                    if (lg.indexOf(wf.elt) !== -1) {
                                        $.each(that.options.wf, function(k, wf2) {
                                            if (wf2.elt !== wf.elt &&
                                                lg.indexOf(wf2.elt) !== -1) {
                                                wf2.pos += deltapos;
                                                $(wf2.elt)
                                                .css("left", "+=" + deltapx + "px");
                                            }
                                        });
                                        return false;
                                    } 
                                })

                                return;
                            }
                        });
                    },
                    hoverClass: "track-drop-hover"
            }).bind("click.edibletimeline", function (event) {
                var offset = that.element.offset();
                var relX = event.pageX - offset.left;
                var scrollLeft = that.element.scrollLeft();
                var msOfClick = (relX + scrollLeft) / that.options.pxPerMs;
                that._setOptions({
                    position: msOfClick
                });
                if (that.options.sound !== undefined) {
                    that.options.sound.setPosition(msOfClick);
                } 
            });
            
            this.element.css("height",
                this.element[0].scrollHeight + 20 + "px");
            
            var playhead = document.createElement('div');
            $(playhead).addClass("playhead")
                .css("height", this.options.tracks * 95 + "px")
                .appendTo(this.element);
            
            this.options._dirtyWaveforms = this.options.wf.slice(0);
            this._refresh();
        },
        
        _refresh: function () {
            // console.log("timeline _refresh");
            var that = this;
            $.each(this.options._dirtyWaveforms, function (i, wf) {
                that.element.find(".track:eq(" + wf.track + ")")
                    .append(wf.elt);
                $(wf.elt).css("left", that.msToPx(wf.pos));
                
                // pin this waveform if necessary
                if (!$(wf.elt).wf("option", "fixed")) {
                    $(wf.elt).draggable({
                        containment: ".edible-timeline"
                    });
                };
                
                $(wf.elt).wf({
                    pxPerMs: that.options.pxPerMs,
                    changed: function (event, args) {
                        // only invoke this function if we didn't just add the
                        // changed callback
                        if (args[0].changed === undefined) {
                            // console.log("CHANGING POS FROM", wf.pos, 
                            //   "TO", that.pxToMs($(wf.elt).position().left));
                            // TODO: figure out why this was here in 
                            // the first place. Maybe it was 
                            // because of stretching tracks?
                            wf.pos = that.pxToMs($(wf.elt).position().left);
                        }                     
                    },
                    destroy: function () {
                        var i;
                        for (i = 0; i < that.options.wf.length; i++) {
                            if (that.options.wf[i] === wf) {
                                that.options.wf.splice(i, 1);
                                that._refresh();
                                break;
                            }
                        }
                    }
                });
            });
            
            $.each(this.options.wf, function (i, wf) {
                $(wf.elt).unbind('click.edibletimeline');
                
                if (that.options.clickMode === "split") {
                    $(wf.elt).bind('click.edibletimeline', function (event) {
                        var res = $(this).wf("slice", event);
                        console.log("POS OF NEW WF", wf.pos + res.pos);
                        console.log("POS OF OLD WF", wf.pos);
                        that.addWaveform({
                            elt: res.waveform,
                            track: wf.track,
                            pos: wf.pos + res.pos
                        });
                        console.log("POS OF OLD WF", wf.pos);
                    });
                } else if (that.options.clickMode === "volume") {
                    $(wf.elt).bind('click.edibletimeline', function (event) {
                       $(this).wf("addVolumeMarker", event); 
                    });
                }
                
            });
            
            this.options._dirtyWaveforms = [];
            this.element.width(this.options.width);
            
            // draw the time indicator
            var currentPosition;
            currentPosition = this.options.position * this.options.pxPerMs;
            this.element.find('.playhead').css("left", currentPosition + "px");
        },

        _destroy: function () {
            $.each(this.options.wf, function (i, wf) {
                $(wf.elt).unbind('.edibletimeline').wf("destroy");
            })
            this.element.removeClass("edible-timeline").html("");
        },

        addWaveform: function (waveform) {
            this.options.wf.push(waveform);
            this.options._dirtyWaveforms.push(waveform);
            this._refresh();
        },

        msToPx: function (ms) {
            return parseFloat(ms) * this.options.pxPerMs;
        },

        pxToMs: function (px) {
            return parseFloat(px) / this.options.pxPerMs;
        },

        export: function () {
            var that = this;
            this.options._dirty = false;
            var exportOpts = [];
            $.each(this.options.wf, function (i, wf) {
                console.log("SCORE START", wf.pos / 1000.0, "WF POS", wf.pos);
                if (!$(wf.elt).wf("option", "mute")) {
                    var $wf = $(wf.elt);
                    exportOpts.push({
                        globalVolume: $wf.wf("option", "globalVolume"),
                        waveformClass: $wf.wf("waveformClass"),
                        extra: $wf.wf("exportExtras"),
                        filename: $wf.wf("option", "filename"),
                        name: $wf.wf("option", "name"),
                        scoreStart: wf.pos / 1000.0,
                        wfStart: $wf.wf("option", "start") / 1000.0,
                        duration: $wf.wf("option", "len") / 1000.0
                    });
                }
            });
            return exportOpts;
        },

        isDirty: function () {
            if (this.options._dirty) {
                return true;
            }
            var i;
            for (i = 0; i < this.options.wf.length; i++) {
                if ($(wf.elt).wf("isDirty")) {
                    return true;
                }
            }
            return false;
        },

        _setOptions: function () {
            // _super and _superApply handle keeping the right this-context
            this._superApply(arguments);
            this._refresh();
        },

        _setOption: function (key, value) {
            // console.log("in _setOption with key:", key, "value:", value);
            this.options._dirty = true;
            switch (key) {
            case "pxPerMs":
                this.options._dirtyWaveforms = this.options.wf.slice(0);
                this.options[key] = value;   
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
