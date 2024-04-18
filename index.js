import { Note, round_frequency_to_note } from "./note.js";
import { find_pitch } from "./pitch.js";
export const TRACK_COUNT = 10;
export const SVG_WINDOW = { x_min: -100, x_max: 100, y_min: -100, y_max: 100 };
let audio_context, analyser, output_node, sample_buffer;
const container = document.querySelector("#container");
let game_active = false;
let speed;
let notes = new Map();
function initialize() {
    audio_context = new AudioContext();
    analyser = audio_context.createAnalyser();
    analyser.fftSize = 2048;
    sample_buffer = new Float32Array(2048);
    const compressor_node = new DynamicsCompressorNode(audio_context, {});
    output_node = new GainNode(audio_context, { gain: 0.1 });
    compressor_node.connect(output_node);
    output_node.connect(audio_context.destination);
    requestMicInput();
    game_active = true;
    speed = 0.2;
    spawn_boxes();
    animate_boxes();
}
const button = document.querySelector("#start-button");
button.onclick = () => {
    button.remove();
    initialize();
};
function requestMicInput() {
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
        audio_context.createMediaStreamSource(stream).connect(analyser);
    })
        .catch((err) => {
        console.error(err);
        alert("Microphone input required to use website.");
    });
}
function spawn_boxes() {
    if (!game_active) {
        return;
    }
    if (notes.size < 2) {
        add_note();
    }
    setTimeout(spawn_boxes, 1400 / speed);
}
function animate_boxes() {
    if (!game_active) {
        return;
    }
    speed *= 1.0003;
    for (let [note, obj] of notes) {
        obj.move(speed);
        if (obj.y >= SVG_WINDOW.y_max) {
            obj.cleanup();
            notes.delete(note);
            // game_over();
        }
    }
    analyser.getFloatTimeDomainData(sample_buffer);
    let pitch = find_pitch(sample_buffer, audio_context.sampleRate);
    if (pitch) {
        const note = round_frequency_to_note(pitch);
        for (const [k, v] of notes) {
            if (k % 12 == note % 12) {
                v.success();
                notes.delete(k);
            }
        }
    }
    requestAnimationFrame(animate_boxes);
}
function game_over() {
    for (const [_, { audio_node }] of notes) {
        audio_node.disconnect();
    }
    notes.clear();
    game_active = false;
}
function add_note() {
    const note = Math.round(Math.random() * 24 - 12);
    if (notes.has(note)) {
        return;
    }
    notes.set(note, new Note(audio_context, output_node, container, note));
}
