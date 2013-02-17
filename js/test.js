/*jslint browser: true vars: true */
/*global $*/

$(function () {
    "use strict";
    var w1 = document.createElement('div');
    var w2 = document.createElement('div');
    
    w1.id = "w1";
    w2.id = "w2";
    
    $(w1).waveform({
            dur: 5000,
            len: 5000,
            name: "speech 1",
            bgColor: "#cf80c8",
            changed: function (event, debugInfo) {
                $("#debug").text(debugInfo);
            }
        });
    $(w2).waveform({
            dur: 10000,
            len: 10000,
            name: "song 1",
            bgColor: "#7bcaee",
            changed: function (event, debugInfo) {
                $("#debug").text(debugInfo);
            }
        });

    var timeline = $("#timeline").timeline({
        wf: [{ elt: w1, track: 0, pos: 0 },
            { elt: w2, track: 1, pos: 1000 }]
    });    
    
    $.getJSON('audio/json/bullw44.wav.json', function (data) {
        console.log("here");
        $(".wfjstest").css("position", "absolute").css("top", "500px");
        var wftest = new Waveform({
            container: $(".wfjstest")[0],
            data: data.mid,
            interpolate: true,
            innerColor: "#000000",
            outerColor: "#cccccc",
            width: 1200,
            height: 75
        });
    });

});