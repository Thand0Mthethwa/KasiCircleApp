import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import BusinessLocationPicker from './BusinessLocationPicker';
import { validCoordinates } from '../models/mapLocation';
beforeEach(()=>{vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(800);vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(400);});
afterEach(()=>vi.restoreAllMocks());
it('starts without a pin and places one only after an explicit map click; keyboard panning does not save a position',()=>{
  const onChange=vi.fn();render(<BusinessLocationPicker position={null} onChange={onChange} disabled={false}/>);
  const map=screen.getByRole('region',{name:'Business location picker'});expect(document.querySelector('.leaflet-marker-icon')).toBeNull();expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(map,{clientX:400,clientY:200});expect(onChange).toHaveBeenCalledOnce();expect(validCoordinates(...onChange.mock.calls[0])).toBe(true);
  fireEvent.keyDown(map,{key:'ArrowRight'});expect(onChange).toHaveBeenCalledOnce();
});
it('renders the saved draft and updates its pin, while disabling placement during mutations',()=>{
  const onChange=vi.fn();const view=render(<BusinessLocationPicker position={[-25.72,28.24]} onChange={onChange} disabled={false}/>);
  expect(screen.getByRole('button',{name:'Selected business location'})).toBeVisible();
  view.rerender(<BusinessLocationPicker position={[-25.73,28.25]} onChange={onChange} disabled/>);
  fireEvent.click(screen.getByRole('region',{name:'Business location picker'}),{clientX:410,clientY:200});expect(onChange).not.toHaveBeenCalled();
});
