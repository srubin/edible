/*jslint browser: true vars: true */
/*global $*/

$(function () {
    "use strict";
    var w1 = document.createElement('div');
    var w2 = document.createElement('div');
    
    w1.id = "w1";
    w2.id = "w2";
    
    $(w1).waveform({
            len: 5000,
            bgColor: "red"
        });
    $(w2).waveform({
            len: 10000,
            bgColor: "purple"
        });

    var timeline = $("#timeline").timeline({
        wf: [
            { elt: w1, track: 0, start: 0 },
            { elt: w2, track: 1, start: 1000 }]
    });
});