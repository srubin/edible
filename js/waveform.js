/*jslint browser: true nomen: true devel: true vars: true */
/*global jQuery, _ */

/*!
 * waveform
 * part of edible in-browser media timeline
 * Author: Steve Rubin
 */
 
 
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.waveform", {
        options: {
            bgColor: "blue",
            height: "75px",
            len: 1000,       // milliseconds
            start: 0,
            pxPerMs: .1
        },
        
        // public
        width: function () {
            return this.options.len * this.options.pxPerMs;
        },
        
        // private 
        _create: function () {
            var that = this;
            var wfTemplate = $("#waveformTemplate").html();
            var $canv;
            var $topBar;
            this.element.addClass('edible-waveform');
            this.element.append(_.template(wfTemplate));
            $canv = this.element.find('.displayCanvas');
            $topBar = this.element.find('.topBar');
            
            // TODO: don't hardcode the snap tolerance
            this.element.draggable({
                handle: $topBar,
                snap2: ".track",
                snap2Mode: "inner",
                snap2Tolerance: 46,
                snap2Sides: "tb",
                stack: ".edible-waveform"
            }).resizable({
                handles: "e, w",
                stop: function (event, ui) {
                    $(event.target).waveform("option", "len", 
                        ui.size.width / that.options.pxPerMs);
                },
                helper: "resizable-helper"
            }).disableSelection().css("position", "absolute");
            
            this._refresh();
        },
        
        _refresh: function () {
            console.log("_refresh-ing");
            this.element.find(".displayCanvas")
                .css("background-color", this.options.bgColor)
                .attr("width", this.width())
                .attr("height", this.options.height);
            this.element.find(".topBar")
                .css("width", this.width());
        },
        
        _destroy: function () {
            
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
            console.log("setOption this", this);
        }
        
    });

}(jQuery, window, document));
