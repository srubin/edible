// this is to support polymorphism with different types of waveforms
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.wfBase", {
        _create: function () {
            // support widget polymorphism
            console.log("REGISTERING AS NAME", this.widgetName)
            this.element.data('waveformClass', this.widgetName);
        },
        _destroy: function () {
            this.element.removeData('waveformClass');
            this._super('destroy');
        }
    });
}(jQuery, window, document));

// access waveform methods through .wf() now
$.fn.wf = function () {
    return this[this.data('waveformClass')].apply(this, arguments);
};