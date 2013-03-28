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
            
            if (!hasData) {
                currentSamples = [];
            }
            
            var selectedGradient = "#FF7F24";
            if (canv !== undefined) {
                selectedGradient = canv.getContext('2d')
                    .createLinearGradient(0, 0, 0, parseInt(this.options.canvHeight));
                selectedGradient.addColorStop(0.0, "#FF7F24");
                selectedGradient.addColorStop(1.0, "#FA9A50");
            }
            

            var colorFunc = gradient;
            
            // highlight words
            if ("highlightedWordsRange" in this.options &&
                this.options.highlightedWordsRange !== undefined) {
                var hwRange = this.options.highlightedWordsRange;
                var pxPerMs = this.options.pxPerMs;
                var hwStart = wordPositions[hwRange[0]] * pxPerMs;
                var hwStop;
                if (hwRange[1] + 1 >= wordPositions.length) {
                    hwStop = that.width();
                } else {
                    hwStop = wordPositions[hwRange[1] + 1] * pxPerMs;
                }
                colorFunc = function (x, y) {
                    var pxX = x * that.width();
                    if (pxX >= hwStart && pxX < hwStop) {
                        return selectedGradient;
                    }
                    return gradient;
                };
            }
            
            var wf = new Waveform({
                canvas: canv,
                data: currentSamples,
                innerColor: colorFunc,
                outerColor: "#333333",
                height: this.options.canvHeight,
                interpolate: true,
                width: this.width()
            });
            
            var drawMarker = function (x, y, ctx) {
                ctx.save();
                ctx.fillStyle = "red";
                ctx.strokeStyle = "#cccccc";
                ctx.beginPath();
                ctx.moveTo(x - 5, y - 15);
                ctx.lineTo(x - 5, y - 5);
                ctx.lineTo(x, y);
                ctx.lineTo(x + 5, y - 5);
                ctx.lineTo(x + 5, y - 15);
                ctx.lineTo(x - 5, y - 15);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            };

            var hitBox = function (x, y, width, height) {
                var ePtBox = document.createElement('div');
                return $(ePtBox)
                    .addClass('emphasisPointBox')
                    .width(width)
                    .height(height)
                    .css({
                        "left": x,
                        "top": y
                    })
                    .appendTo(that.element);
            };

            // render emphasis points on the waveform
            $(this.element).find('.emphasisPointBox').remove();
            $.each(this.options.currentWords, function (j, word) {
                if (word.hasOwnProperty('emphasisPoint') &&
                    word.emphasisPoint) {
                    // label the emphasis point at the end of the word
                    var x = wordPositions[j + 1] * that.options.pxPerMs;
                    var y = 20;
                    drawMarker(x, y, canv.getContext('2d'));
                    var hb = hitBox(x - 5, y, 10, 15);
                    hb.data("wordIndex", j);

                    hb.click(function () {
                        // create musical underlay
                        that.options.emphasisPointFunc($(this).data("wordIndex"));
                    });
                }
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
            }
        },
        
    });
}(jQuery, window, document));