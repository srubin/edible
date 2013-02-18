/* text-aligned waveform
 * part of the edible timeline editor
 */
 
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.textAlignedWaveform", $.edible.waveform, {
        _create: function () {
            this._super("_create");
        },
        
        waveformClass: function () {
            return "textAlignedWaveform";
        },
        
        // draws the waveform according to the current text
        _drawWaveform: function () {
            var that = this;
            var i, start, end, delta, tmpSamples, tsi;
            var hasData = (this.options.data.length > 0);
            
            // get sample info
            var nsamples = this.options.data.length;
            var sampPerMs = nsamples / this.options.dur;
            var startSample = this.options.start * sampPerMs;
            var endSample = startSample + this.options.len * sampPerMs;
            var currentSamples = [];
            
            // get the duration of the words
            var currentDuration = 0;
            $.each(this.options.currentWords, function (j, word) {
                if (word.alignedWord === "gp") {
                    currentDuration += parseInt(word.pauseLength * 1000.0);
                    // just some zeros for padding
                    tmpSamples = [];
                    for (tsi = 0; tsi < word.pauseLength * 1000.0 * sampPerMs; tsi++) {
                        tmpSamples[tsi] = 0;
                    }

                    // add them to the samples array
                    currentSamples.push.apply(currentSamples, tmpSamples);
                } else {
                    start = word.start * 1000.0;
                    end = word.end * 1000.0
                    delta = end - start;
                    currentDuration += parseInt(delta);
                    
                    // get the waveform samples for the word
                    if (hasData) {
                        startSample = parseInt(start * sampPerMs);
                        endSample = parseInt(end * sampPerMs);
                        tmpSamples = that.options.data.slice(startSample, endSample);
                        currentSamples.push.apply(currentSamples, tmpSamples);
                    }
                }
            });
            
            // set the length of the waveform
            this.options.len = currentDuration;
            
            // draw the waveform
            var canv = this.element.find('.displayCanvas')[0];
            
            // lame width update
            $(canv).attr("width", this.width());
            this.element.find('.topBar').css("width", this.width());
            
            var gradient = "#4BF2A7";
            if (canv !== undefined) {
                gradient = canv.getContext('2d')
                    .createLinearGradient(0, 0, 0, parseInt(this.options.canvHeight));
                gradient.addColorStop(0.0, "#4BF2A7" );
                gradient.addColorStop(1.0, "#32CD32" );
            }
            
            if (!hasData) {
                currentSamples = [];
            }
            
            var wf = new Waveform({
                canvas: canv,
                data: currentSamples,
                innerColor: gradient,
                outerColor: "#333",
                height: this.options.canvHeight,
                interpolate: true,
                width: this.width()
            });

        },
        
    });
}(jQuery, window, document));