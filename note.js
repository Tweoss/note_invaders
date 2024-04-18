import { SVG_WINDOW, TRACK_COUNT } from "./index.js";
export class Note {
    constructor(context, output_node, svg_container, note) {
        const oscillator = new OscillatorNode(context, {
            type: "sine",
            frequency: note_to_frequency(note),
        });
        const track = Math.floor(Math.random() * TRACK_COUNT);
        this.y = -100;
        this.context = context;
        oscillator.start();
        const gain = new GainNode(context, { gain: 0 });
        oscillator.connect(gain);
        gain.connect(output_node);
        this.audio_node = gain;
        this.svg = create_note_svg(track, this.y);
        this.output_node = output_node;
        function create_note_svg(track, start_y) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            const track_width = (SVG_WINDOW.x_max - SVG_WINDOW.x_min) / TRACK_COUNT;
            svg.setAttribute("width", track_width.toString());
            svg.setAttribute("height", "5");
            svg.setAttribute("x", (SVG_WINDOW.x_min + track_width * track).toString());
            svg.setAttribute("y", start_y.toString());
            svg.setAttribute("fill", `hsl(${~~(360 * Math.random())}, 70%,  72%)`);
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            svg_container === null || svg_container === void 0 ? void 0 : svg_container.appendChild(svg);
            return svg;
        }
    }
    move(delta) {
        this.y += delta;
        this.svg.setAttribute("y", this.y.toString());
        const transition = [SVG_WINDOW.y_min, SVG_WINDOW.y_min + 5];
        const on = (v) => v < transition[0] ? 0 : Math.exp(-1 / (v - transition[0]));
        const desired_volume = on(this.y) / (on(this.y) + on(transition[1] - this.y));
        this.audio_node.gain.exponentialRampToValueAtTime(desired_volume, this.context.currentTime + 1 / 60);
        this.audio_node;
    }
    success() {
        this.svg.setAttribute("fill", "green");
        setTimeout(() => this.svg.setAttribute("fill", "#0000"), 500);
        setTimeout(() => this.cleanup(), 1000);
    }
    cleanup() {
        const fadeout = 0.9;
        this.audio_node.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + fadeout);
        setTimeout(() => {
            this.audio_node.disconnect();
        }, fadeout * 1000);
        this.svg.remove();
    }
}
// Take A = 440 as 0.
function note_to_frequency(note) {
    return 440 * Math.pow(2, (1 / 12) * note);
}
export function round_frequency_to_note(frequency) {
    return Math.round(Math.log2(frequency / 440) * 12);
}
