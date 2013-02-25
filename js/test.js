/*jslint browser: true vars: true */
/*global $*/

;$(function () {
    "use strict";
    var w1 = document.createElement('div');
    var w2 = document.createElement('div');
    
    w1.id = "w1";
    w2.id = "w2";
    
    var wfdata;
    
    $.ajax("audio/json/bullw44.wav.json", {
        dataType: "json",
        async: false,
        success: function (data) {
            wfdata = data.mid;
        }
    });
    
    $(w1).waveform({
            dur: 223501,
            len: 223501,
            data: wfdata,
            name: "speech 1",
            changed: function (event, debugInfo) {
                $("#debug").text(debugInfo);
            }
        });
    $(w2).waveform({
            dur: 100000,
            len: 100000,
            name: "song 1",
            changed: function (event, debugInfo) {
                $("#debug").text(debugInfo);
            }
        });

    var timeline = $("#timeline").timeline({
        pxPerMs: .0025,
        wf: [{ elt: w1, track: 0, pos: 0 },
            { elt: w2, track: 1, pos: 1000 }]
    });

});