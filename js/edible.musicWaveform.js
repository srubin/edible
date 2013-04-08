/* music waveform
 * part of the edible timeline editor
 * - requires jsnetworkx
 */
 
;(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.musicWaveform", $.edible.waveform, {
        
        MAX_VOL: 1.5,
        
        _create: function () {
            var cbi;
            var cb;
            var i;

            this.options._graph = this._createGraph();
            var allBeats = this.options._graph.nodes().slice(0)
                    .sort(function (a, b){
                        return parseFloat(a) - parseFloat(b);
                    });
            this.options._beatOrder = allBeats.slice(0);

            if (this.options.currentBeats === undefined) {
                this.options.currentBeats = allBeats;
                console.log(this.options.currentBeats);

                if (this.options.start !== 0.0 ||
                    this.options.dur !== this.options.len) {
                    cb = this.options.currentBeats.slice(0);
                    this.options.currentBeats = [];
                    for (i = 0; i < cb.length; i++) {
                        cbi = parseFloat(cb[i]) * 1000.0;
                        if (cbi >= this.options.start &&
                            cbi < this.options.start + this.options.len) {
                            this.options.currentBeats.push(cb[i]);
                        }
                    }
                    this.options.start =
                        parseFloat(this.options.currentBeats[0]) * 1000.0;
                }
            } else {
                this.options.start =
                    parseFloat(this.options.currentBeats[0]) * 1000.0;
            }
            
            // the super...
            this._super("_create");
            
            // change the resizing
            var that = this;
            this.element.resizable({
                stop: function (event, ui) {
                    var oldLen = that.options.len;
                    var oldStart = that.options.start;
                    var newOpts = that._computePosFromResize(event, ui);
                    
                    console.log("setting new len", newOpts.len,
                        "and start", newOpts.start);
                    
                    that._updateCurrentBeatsFromResize(oldLen, oldStart,
                        newOpts.len, newOpts.start);
                    that._setOptions(newOpts);    
                    that._refresh();
                } 
            })
        },
        
        _updateCurrentBeatsFromResize: function (ol, os, nl, ns) {
            var ds, dl, newBeat, t;
            var firstBeat = this.options.currentBeats[0];
            var currentBeats = this.options.currentBeats;
            var idx;
            if (ns > os) {
                ds = ns - os;
                newBeat = this._msToBeat(ds);
                console.log("old BEATS", currentBeats);
                this.options.currentBeats = currentBeats.slice(newBeat);
                console.log("new BEATS", currentBeats);
                return;
            }
            if (ns < os) {
                // unclear how exactly this should behave
                ds = os - ns;
                t = parseFloat(firstBeat) * 1000.0 - ds
                if (t >= 0) {
                    idx = this.options._beatOrder.indexOf(firstBeat);
                    console.log("old BEATS", currentBeats);
                    while (parseFloat(currentBeats[0]) * 1000.0 >
                        t && idx > 0) {
                        currentBeats.unshift(this.options._beatOrder[--idx]);
                    }
                    console.log("new BEATS", currentBeats);
                    return;
                } else {
                    throw "RESIZED TOO FAR! CLEAN UP THE MUSIC RESIZE CODE, STEVE";
                }
            }
            if (nl > ol) {
                idx = this.options._beatOrder.indexOf(currentBeats[currentBeats.length - 1]);
                console.log("old BEATS (nl > ol)", currentBeats);
                while (parseFloat(currentBeats[currentBeats.length - 1]) *
                    1000.0 < ns + nl &&
                    idx < this.options._beatOrder.length - 1) {
                    
                    currentBeats.push(this.options._beatOrder[++idx]);
                }
                console.log("new BEATS", currentBeats);
                return;
            }
            if (nl < ol) {
                console.log("old BEATS (nl < ol)", currentBeats);
                newBeat = this._msToBeat(nl);
                this.options.currentBeats = currentBeats.slice(0, newBeat);
                console.log("new BEATS", currentBeats);
                return;
            }
        },
        
        waveformClass: function () { return "musicWaveform" },
        
        _updateBeatSet: function () {
            var i;
            var beatSet = {};
            var count = 0;
            var currentBeats = this.options.currentBeats;
            for (i = 0; i < currentBeats.length; i++) {
                beatSet[currentBeats[i]] = true;
            }
            this.options._beatSet = beatSet;
        },
        
        _refresh: function () {
            this._super("_refresh");
            this._updateBeatSet();
            this.findLoops();
        },
        
        addLoop: function (direction) {
            var cyc;
            var origLen = this.options.len;
            var origStart = this.options.start;
            var currentBeats = this.options.currentBeats;
            var i;
            var cycleStart;
            var args;
            var cycleLen = 0.0;
            var graph = this.options._graph;
            
            if (this.options._simpleCycles === undefined) {
                return;
            } else {
                cyc = this.options._simpleCycles[0];
                for (i = 0; i < currentBeats.length; i++) {
                    if (currentBeats[i] === cyc[0]) {
                        cycleStart = i;
                        break;
                    }
                }
                args = [cycleStart, 1].concat(cyc);
                Array.prototype.splice.apply(this.options.currentBeats, args);
                
                $.each(cyc.slice(0,-1), function (idx, beat) {
                    cycleLen += graph.succ[beat][cyc[idx + 1]].duration * 1000.0;
                });
                
                console.log("OLD LEN", origLen, "CYC LEN", cycleLen, "NEW LEN", origLen + cycleLen);
                
                this._setOptions({
                    len: origLen + cycleLen
                });
                
                if (direction === "left") {
                    // change waveform pos in timeline
                    var newStart = origStart - (this.options.len - origLen)
                }

                if (this.options.hasOwnProperty("loopCallback")) {
                    this.options.loopCallback();
                }

                return;
            }
        },
        
        _linearCycles: function () {
            var currentBeats = this.options.currentBeats;
            var subgraph = this.options._graph.subgraph(currentBeats);
            var beatOrder = this.options._beatOrder;
            var beatSet = this.options._beatSet;
            var i, j;
            var startBeat, endBeat;
            var cycles = [];
            var cyc;
            
            for (i = 0; i < beatOrder.length; i++) {
                startBeat = beatOrder[i];
                if (startBeat in beatSet) {
                    for (j = i + 1; j < beatOrder.length; j++) {
                        endBeat = beatOrder[j];
                        if (endBeat in beatSet) {
                            if (startBeat in subgraph.succ[endBeat]) {
                                // there's a jump backwards from
                                // endBeat to startBeat
                                cyc = beatOrder.slice(i, j + 1);
                                cyc.push(startBeat);
                                cycles.push(cyc);
                            }
                        }
                    }
                }
            }
            
            cycles.sort(function (a, b) {
                return a.length - b.length;
            });
            
            return cycles;
        },
        
        findLoops: function () {
            if (!this.options.hasOwnProperty("musicGraph")) {
                return [];
            }
            
            this.element.find('.loopControlLeft').remove();
            this.element.find('.loopControlRight').remove();
            
            if (Object.keys(this.options._beatSet).length > 140) {
                return;
            }
                        
            var nodes = [];
            var graph = this.options._graph;
            var loopL, loopR;
            var that = this;
            
            var cycles = this._linearCycles();
            
            console.log("cycles", cycles);
            if (cycles.length > 0) {
                that.options._simpleCycles = cycles;

                loopR = document.createElement('div');
                $(loopR).html('<i class="icon-repeat icon-white"></i>')
                    .addClass("loopControlRight")
                    .click(function () {
                        that.addLoop("right");
                        event.preventDefault();
                        return false;
                    });
                that.element.append(loopR);
            } else {
                that.options._simpleCycles = undefined;
                that.element.find('.loopControlLeft').remove();
                that.element.find('.loopControlRight').remove();
            }

        },
        
        exportExtras: function () {
            this.options._dirty = false;
            var mainctx = this.options._mcanv.getContext('2d');
            var vx = this.options.volume.x.slice(0);
            var vy = this.options.volume.y.slice(0);
            var pxPerMs = this.options.pxPerMs;
            
            vx.splice(0, 0, 0);
            vx.push((mainctx.canvas.width - 1) / pxPerMs);
            
            vy.splice(0, 0, vy[0]);
            vy.push(vy[vy.length - 1]);

            return {
                starts: this.options._exportStarts,
                durations: this.options._exportDurations,
                distances: this.options._exportDistances,
                volume: {
                    x: vx,
                    y: vy
                }
            };
        },
        
        // slice on the beat
        slice: function (event) {
            // create a copy of this waveform
            var offset = this.element.offset(); 
            var relX = event.pageX - offset.left;
            var newWaveform = document.createElement('div');
            var msOfClick = relX / this.options.pxPerMs;
            
            var beatIndex = this._msToBeat(msOfClick);
            var sliceTime = this.options._beatToTime[beatIndex];
            
            console.log("beat index", beatIndex, "slice time", sliceTime);

            var newOptions = $.extend(true, {},
                this.options, {
                    start: sliceTime,
                    len: this.options.len - sliceTime,
            });
            var newBeats = this.options.currentBeats.slice(beatIndex);
            newOptions.currentBeats = newBeats;
            console.log("new beats", newBeats);
            
            // initialize the new waveform
            var $nwf = $(newWaveform)[this.waveformClass()](newOptions);

            this._setOptions({
                currentBeats: this.options.currentBeats.slice(0, beatIndex),
                len: sliceTime,
                _nextBeatHidden: this.options.currentBeats[beatIndex]
            });
            return {
                waveform: newWaveform,
                pos: sliceTime
            };
        },
        
        // helper to get beat at slice
        _msToBeat: function (ms) {
            if (!this.options.hasOwnProperty("_timeToBeat")) {
                throw "No _timeToBeat in options";
            }
            var ttb = this.options._timeToBeat;
            var closest = null;
            var closestBeat = null;
            $.each(ttb, function (t, beat) {
                if (closest == null || Math.abs(t - ms) < Math.abs(closest - ms)) {
                    closest = t;
                    closestBeat = beat;
                }
            });
            return closestBeat;
        },
        
        // draw waveform according to the current beats
        _drawWaveform: function () {
            // check for the beat graph
            if (!this.options.hasOwnProperty("_graph")) {
                this._super("_drawWaveform");
                return;
            }
            
            var that = this;
            var i, start, end, delta, tmpSamples, tsi, closest, deltaSec, dist;
            var hasData = (this.options.data.length > 0);
            
            // get sample info
            var nsamples = this.options.data.length;
            var sampPerMs = nsamples / this.options.dur;
            var startSample = this.options.start * sampPerMs;
            var endSample = startSample + this.options.len * sampPerMs;
            var currentSamples = [];
            var graph = this.options._graph;
            var currentBeats = this.options.currentBeats;
            console.log("CURRENT BEATS LEN", currentBeats.length, currentBeats);

            // get the duration of the beats
            var currentDuration = 0.0;
            
            this.options._timeToBeat = {};
            this.options._beatToTime = [];
            this.options._exportStarts = [];
            this.options._exportDurations = [];
            this.options._exportDistances = [];

            // if the first beat is the starting beat, render the beginning
            if (currentBeats[0] === this.options._beatOrder[0]) {
                that.options._timeToBeat[currentDuration] = 0;
                that.options._exportStarts.push(0);
                that.options._exportDurations.push(parseFloat(currentBeats[0]));
                that.options._exportDistances.push(0);
                
                console.log("Using the intro", currentBeats[0]);
                end = parseFloat(currentBeats[0]) * 1000.0;
                currentDuration += end;
                // currentDuration += parseInt(end);
                
                if (hasData) {
                    endSample = parseInt(end * sampPerMs);
                    tmpSamples = that.options.data.slice(0, endSample);
                    currentSamples.push.apply(currentSamples, tmpSamples);
                }
            }
        
            $.each(currentBeats, function (j, beat) {
                if (j === currentBeats.length - 1 &&
                    beat === that.options._beatOrder[that.options._beatOrder.length - 1]) {
                        
                    // if the final beat is the ultimate beat, render the ending
                    
                    start = parseFloat(beat) * 1000.0;
                    end = parseFloat(that.options.dur);
                    delta = end - start;
                    deltaSec = parseFloat(that.options.dur) /
                        1000.0 - parseFloat(beat);
                    dist = 0;
                } else if (j === currentBeats.length - 1) {
                    
                    // if the final beat is not the ultimate beat
                    console.log("hanging final beat", "len", that.options.len);
                    start = parseFloat(beat) * 1000.0;
                    delta = that.options.len - currentDuration;
                    if (delta < 0) {
                        delta = 0;
                    }
                    deltaSec = delta / 1000.0;
                    end = start + delta;
                    
                    console.log("current duration", currentDuration);
                    console.log("start", start, "end", end);

                    dist = 0;
                } else {
                    
                    // normal beats
                    // (where the next beat is also in the currentBeats)
                    
                    start = parseFloat(beat) * 1000.0;

                    if (graph.succ[beat].hasOwnProperty(currentBeats[j + 1])) {
                        // transition to next beat is in the graph
                        deltaSec = graph.succ[beat][currentBeats[j + 1]].duration;
                        dist = graph.succ[beat][currentBeats[j + 1]].distance;
                    } else {
                        // transition to next beat isn't in our graph!
                        // this can happen when we manually specify a beat order
                        var firstKey = Object.keys(graph.succ[beat])[0];
                        deltaSec = graph.succ[beat][firstKey].duration;
                        dist = 1; // just has to not be zero...
                    }

                    delta = deltaSec * 1000.0;
                    end = start + delta;
                }
                
                
                that.options._timeToBeat[currentDuration] = j;
                that.options._beatToTime[j] = currentDuration;
                
                that.options._exportStarts.push(parseFloat(beat));
                that.options._exportDurations.push(deltaSec);
                that.options._exportDistances.push(dist);
                    
                currentDuration += delta;
                // currentDuration += parseInt(delta);
                    
                // get the waveform samples for the beat
                if (hasData) {
                    startSample = parseInt(start * sampPerMs);
                    endSample = parseInt(end * sampPerMs);
                    tmpSamples = that.options.data.slice(startSample, endSample);
                    currentSamples.push.apply(currentSamples, tmpSamples);
                }

            });
            
            // set the length of the waveform
            this.options.len = currentDuration;
            
            // draw the waveform
            // var canv = this.element.find('.displayCanvas')[0];
            var canv = this.options._mcanv;
            
            // lame width update
            $(canv).attr("width", this.width());
            this.element.find('.topBar').css("width", this.width());
            
            var gradient = "#4BF2A7";
            if (canv !== undefined) {
                gradient = canv.getContext('2d')
                    .createLinearGradient(0, 0, 0, parseInt(this.options.canvHeight, 10));
                // gradient.addColorStop(0.0, "#4BF2A7" );
                // gradient.addColorStop(1.0, "#32CD32" );

                gradient.addColorStop(0.0, "#333");
                gradient.addColorStop(1.0, "#777");
            }
            
            if (!hasData) {
                currentSamples = [];
            }
            
            var wf = new Waveform({
                canvas: canv,
                data: currentSamples,
                innerColor: gradient,
                outerColor: "#eee",
                // outerColor: "#333",
                height: this.options.canvHeight,
                interpolate: true,
                width: this.width()
            });
            
            // set up cached canvas
            if (this.options._tmpCanv !== undefined) {
                this.options._tmpCanv.destroy();
            }
            var tmpCanv = document.createElement('canvas');
            $(tmpCanv).appendTo("body");
            this.options._tmpCanv = new EDIBLE.modules.MultiCanvas(tmpCanv);
            this.options._tmpCanv.clone(canv);
            this.options._tmpCanv.canvases.forEach(function (canv) {
                $(canv).css("display", "none");
            });
            
            setTimeout(function () {
                that._drawVolume(true);
            }, 0);
        },
        
        addVolumeMarker: function (event) {
            var offset = this.element.offset(); 
            var relX = event.pageX - offset.left;
            var relY = event.pageY - offset.top - this.options.topBarHeight;
            var msOfClick = relX / this.options.pxPerMs;
            
            // var beatIndex = this._msToBeat(msOfClick);
            // var sliceTime = this.options._beatToTime[beatIndex];
            
            var mainctx = this.options._mcanv.getContext('2d');
            var self = this;
            var vy = function (y) {
                return self.MAX_VOL -
                    (self.MAX_VOL * y) / mainctx.canvas.height;
            };
            
            var i;
            var vx = this.options.volume.x;
            for (i = 0; i < vx.length; i++) {
                if (vx[i] > msOfClick) {
                    vx.splice(i, 0, msOfClick);
                    this.options.volume.y.splice(i, 0, vy(relY));
                    break;
                }
            }
            if (i === vx.length) {
                vx.push(msOfClick);
                this.options.volume.y.push(vy(relY));
            }
            this._drawVolume(true);
        },
        
        _drawVolume: function (handles) {
            var self = this;
            this.options._mcanv.clone(this.options._tmpCanv);
            var mainctx = this.options._mcanv.getContext('2d');

            // mainctx.save();
            mainctx.strokeStyle = "#CFB52B";
            mainctx.lineWidth = 3;
            mainctx.beginPath();

            var vx = this.options.volume.x.slice(0);
            var vy = this.options.volume.y.slice(0);
            var pxPerMs = this.options.pxPerMs;
            
            var i;
            var msLen = (mainctx.canvas.width - 1) / pxPerMs;
            var prune = false;
            for (i = 0; i < vx.length; i++) {
                if (vx[i] >= msLen) {
                    prune = true;
                    break;
                }
            }
            if (prune) {
                this.options.volume.x = vx.slice(0, i);
                this.options.volume.y = vy.slice(0, i);
            }
            
            vx.splice(0, 0, 0);
            vx.push((mainctx.canvas.width - 1) / pxPerMs);
            
            vy.splice(0, 0, vy[0]);
            vy.push(vy[vy.length - 1]);
            
            var y = function (vy) {
                return mainctx.canvas.height -
                    (mainctx.canvas.height * vy / self.MAX_VOL)
            };
            
            var x = function (vx) {
                return vx * pxPerMs;
            };
            
            var newx = vx.map(x);
            var newy = vy.map(y);
            
            mainctx.moveTo(x(vx[0]), y(vy[0]));
            
            var cdf = new MonotonicCubicSpline(newx, newy);
            
            var jump = 3;
            var i;
            for (i = 0; i < mainctx.canvas.width; i += jump) {
                mainctx.lineTo(i, cdf.interpolate(i));
            }
            mainctx.stroke();
            
            if (handles !== undefined && handles) {
                // destroy old handles
                $(this.element).find('.volumeHandle').remove();
                
                var updateVolume = function (event, ui) {
                    // update the volume position
                    var left = ui.position.left + 4;
                    var top = ui.position.top + 4
                         - self.options.topBarHeight;
                    var msPos = left / self.options.pxPerMs;
                    var mainctx = self.options._mcanv.getContext('2d');
                    var vy = function (y) {
                        return self.MAX_VOL -
                            (self.MAX_VOL * y) / mainctx.canvas.height;
                    };
                    
                    var i = ui.helper.data("i");
                    
                    var validPos = true;
                    if (i > 0 && self.options.volume.x[i - 1] >= msPos) {
                        validPos = false;
                    }
                    if (i < self.options.volume.x.length - 1 &&
                        self.options.volume.x[i + 1] <= msPos) {
                        validPos = false;
                    }
                    if (validPos) {
                        self.options.volume.x[i] = msPos;
                        self.options.volume.y[i] = vy(top);
                    }
                };
                
                // create handles
                var h;
                vx = this.options.volume.x;
                vy = this.options.volume.y;
                for (i = 0; i < vx.length; i++) {
                    h = document.createElement('div');
                    $(h).addClass("volumeHandle")
                        .data("vx", vx[i])
                        .data("vy", vy[i])
                        .data("i", i)
                        .css({
                            left: x(vx[i]) - 4,
                            top: y(vy[i]) + this.options.topBarHeight - 4
                        })
                        .appendTo(this.element)
                        .draggable({
                            containment: $(this.element),
                            drag: function (event, ui) {
                                updateVolume(event, ui);
                                self._drawVolume(false);
                            },
                            stop: function (event, ui) {
                                updateVolume(event, ui);
                                self._drawVolume(true);
                            }
                        });
                }
            }
        },

        _createGraph: function() {
            if (!this.options.hasOwnProperty("musicGraph")) {
                return undefined;
            }
            var graph = this.options.musicGraph;
            var G = new jsnx.DiGraph();
            G.add_nodes_from(graph.nodes);
            console.log("nodes", G);
            G.add_edges_from(graph.edges);
            console.log("with edges", G);
            return G;
        },
        
        _setOption: function (key, value) {
            this.options._dirty = true;
            // console.log("in _setOption with key:", key, "value:", value);
            switch (key) {
            case "musicGraph":
                this.options["musicGraph"] = value;
                this.options["_graph"] = this._createGraph();
                break;
            default:
                this.options[key] = value;
                break;
            }
            
            this._super("_setOption", key, value);
        }
        
    });
}(jQuery, window, document));