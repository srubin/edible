/* music waveform
 * part of the edible timeline editor
 */
 
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.musicWaveform", $.edible.waveform, {
        _create: function () {
            this._super("_create");
        },
        
        waveformClass: function () {
            return "musicWaveform";
        },
                
        _drawWaveform: function () {
            this._super("_drawWaveform");
            if (this.options.hasOwnProperty("musicGraph")) {
                alert("Music Graph!");
            }
        },
        
    });
}(jQuery, window, document));