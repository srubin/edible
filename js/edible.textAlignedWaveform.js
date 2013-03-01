/* text-aligned waveform
 * part of the edible timeline editor
 */
 
;(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.textAlignedWaveform", $.edible.waveform, {
        _create: function () {
            this._super("_create");
        },
        
        waveformClass: function () { return "textAlignedWaveform" },
        
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
            
            // keep track of the position of each word
            var wordPositions = [];
            
            // get the duration of the words
            var currentDuration = 0;
            $.each(this.options.currentWords, function (j, word) {
                
                // position used for rendering text on waveform
                wordPositions.push(currentDuration);
                
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
            // var canv = this.element.find('.displayCanvas')[0];
            
            // var canv = new EDIBLE.modules.MultiCanvas(this.element.find('.displayCanvas')[0]);
            // console.log("CANVAS", canv);

            var canv = this.options._mcanv;
            console.log("CANVAS", canv, "ctx", canv.getContext('2d'))
            

            
            // lame width update
            // $(canv).attr("width", this.width());
            canv.getContext('2d').canvas.width = this.width();
            canv.getContext('2d').canvas.height = parseInt(this.options.canvHeight);
            
            this.element.find('.topBar').css("width", this.width());
            
            var gradient = "#4BF2A7";
            if (canv !== undefined) {
                gradient = canv.getContext('2d')
                    .createLinearGradient(0, 0, 0, parseInt(this.options.canvHeight));
                gradient.addColorStop(0.0, "#4BF2A7" );
                gradient.addColorStop(1.0, "#32CD32" );
            }
            
            console.log("GRADIENT", gradient)
            
            if (!hasData) {
                currentSamples = [];
            }
            
            var wf = new Waveform({
                canvas: canv,
                data: currentSamples,
                innerColor: gradient,
                outerColor: "#333333",
                height: this.options.canvHeight,
                interpolate: true,
                width: this.width()
            });
            
            // render text on waveform
            // don't do it for now... need to figure out problem
            // with canvas width limitations
            if (false) {
                var ctx = canv.getContext('2d');
                ctx.save();
                ctx.font = "6pt Silkscreen";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                $.each(this.options.currentWords, function (j, word) {
                    var xPos = wordPositions[j] * that.options.pxPerMs;
                    var xNext;
                    if (j + 1 < that.options.currentWords.length) {
                        xNext = wordPositions[j + 1] * that.options.pxPerMs;
                        ctx.fillText(word.word, xPos + (xNext - xPos) / 2,
                            15, xNext - xPos);
                    } else {
                        ctx.textAlign = "left";
                        ctx.fillText(word.word, xPos, 15);
                    }
                });
                ctx.restore();
            
                console.log("canvas size", this.width());
            }
        },
        
    });
}(jQuery, window, document));