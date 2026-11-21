import { describe, expect, it } from 'vitest';
import { timeline } from '../engine';
import { narrate } from './index';
import { process } from './diagrams';
import { vacuumPolarization } from './es/ch7';

describe('narrate', () => {
  it('tells Møller scattering in time, with the charge balance', () => {
    const tl = timeline(process('moller', 't'));
    expect(narrate(tl, 0).text).toBe('Entran dos electrones.');
    expect(narrate(tl, 1)).toMatchObject({ title: 'Vértice 1', text: 'Un electrón emite un fotón virtual y sigue su camino.', charge: '−1 → −1 + 0' });
    expect(narrate(tl, 2).text).toBe('Un electrón absorbe un fotón virtual.');
    expect(narrate(tl, 3).text).toMatch(/^Salen dos electrones\. Con 2 vértices, .* e²\.$/);
  });
  it('points out that a positron moves forward in time', () => {
    expect(narrate(timeline(process('bhabha', 's')), 0).text).toContain('El positrón avanza en el tiempo');
  });
  it('describes pair creation and annihilation inside a loop', () => {
    const tl = timeline(vacuumPolarization());
    const texts = tl.events.map((_, i) => narrate(tl, i + 1));
    expect(texts[1].text).toBe('Un fotón virtual se convierte en un par: un electrón virtual y un positrón virtual.');
    expect(texts[1].charge).toBe('0 → −1 + 1');
    expect(texts[2].text).toContain('se aniquilan en un fotón virtual');
  });
});
