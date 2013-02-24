/* music waveform
 * part of the edible timeline editor
 * - requires jsnetworkx
 */
 
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.musicWaveform", $.edible.waveform, {
        _create: function () {
            this.options._graph = this._createGraph();
            if (this.options.currentBeats === undefined) {
                this.options.currentBeats = this.options._graph.nodes().slice(0)
                    .sort(function (a, b){
                        return parseFloat(a) - parseFloat(b);
                    })
                this.options.beatOrder = this.options.currentBeats.slice(0);
                console.log(this.options.currentBeats);
            }
            this._super("_create");
        },
        
        waveformClass: function () {
            return "musicWaveform";
        },
        
        _refresh: function () {
            this._super("_refresh");
        },
        
        findLoops: function () {
            if (!this.options.hasOwnProperty("musicGraph")) {
                return [];
            }
            if (this.options.len > 20000) {
                return;
            }
            var start = this.options.start;
            var end = this.options.start + this.options.len;
                        
            var nodes = [];
            var graph = this.options._graph;

            $.each(graph.node, function (key, node) {
                var lab = parseFloat(node.label);
                if (lab * 1000.0 >= start && lab * 1000.0 < end) {
                    nodes.push(node.label);
                }
            });

            var subgraph = graph.subgraph(nodes);
            var cycles = jsnx.simple_cycles(subgraph);
            console.log("cycles", cycles);
            if (cycles.length > 0) {
                
            }
        },
        
        exportExtras: function () {
            return {
                beats: this.options.currentBeats
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
            var i, start, end, delta, tmpSamples, tsi, closest;
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
            var currentDuration = 0;
            
            this.options._timeToBeat = {};
            this.options._beatToTime = [];

            // if the first beat is the starting beat, render the beginning
            if (currentBeats[0] === this.options.beatOrder[0]) {
                that.options._timeToBeat[currentDuration] = 0;
                
                console.log("Using the intro", currentBeats[0]);
                end = parseFloat(currentBeats[0]) * 1000.0;
                currentDuration += parseInt(end);
                
                if (hasData) {
                    endSample = parseInt(end * sampPerMs);
                    tmpSamples = that.options.data.slice(0, endSample);
                    currentSamples.push.apply(currentSamples, tmpSamples);
                }
            }
        
            $.each(currentBeats, function (j, beat) {
                if (j === currentBeats.length - 1 &&
                    beat === that.options.beatOrder[that.options.beatOrder.length]) {
                        
                    // if the final beat is the ultimate beat, render the ending
                    
                    start = parseFloat(beat) * 1000.0;
                    end = that.options.dur;
                    delta = end - start;
                } else if (j === currentBeats.length - 1) {
                    
                    // if the final beat is not the ultimate beat
                    
                    start = parseFloat(beat) * 1000.0;
                    if (that._nextBeatHidden !== undefined) {
                        delta = graph.succ[beat][that._nextBeatHidden].duration * 1000.0;
                    } else {
                        delta = null;
                        closest = null;
                        $.each(graph.succ[beat], function (b, data) {
                            if (closest == null ||
                                Math.abs(parseFloat(b) - parseFloat(beat)) <
                                    Math.abs(closest - parseFloat(beat))) {
                                closest = parseFloat(b);
                                delta = data.duration * 1000.0;    
                            }
                        });
                    }
                    end = start + delta;
                } else {
                    
                    // normal beats
                    // (where the next beat is also in the currentBeats)
                    
                    start = parseFloat(beat) * 1000.0;
                    delta = graph.succ[beat][currentBeats[j + 1]].duration * 1000.0;
                    end = start + delta;
                }
                
                
                that.options._timeToBeat[currentDuration] = j;
                that.options._beatToTime[j] = currentDuration;
                    
                currentDuration += parseInt(delta);
                    
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