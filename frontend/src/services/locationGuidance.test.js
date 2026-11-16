import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeSearchStatus, parsePlaces, searchPlaces } from './placeSearch';
import { requestDeviceLocation } from './deviceLocation';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
describe('backend place search',()=>{
  it('reads availability without a provider key in the client',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({enabled:false})}));
    expect(await placeSearchStatus()).toBe(false);expect(fetch.mock.calls[0][0]).toMatch(/\/api\/places\/status$/);
  });
  it('submits an explicit encoded query with authentication and bounded validated results',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[{name:'Daveyton',formattedAddress:'Daveyton, Gauteng, South Africa',latitude:-26.15,longitude:28.42},{formattedAddress:'Bad',latitude:91,longitude:0}]})}));
    localStorage.setItem('kasicircle_token','test-session');
    expect(await searchPlaces(' Daveyton ')).toEqual([expect.objectContaining({name:'Daveyton',label:'Daveyton, Gauteng, South Africa',latitude:-26.15})]);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/places\/search\?q=Daveyton$/),expect.objectContaining({cache:'no-store',redirect:'error',headers:{Authorization:'Bearer test-session'}}));
  });
  it('validates queries before requesting and handles empty, failed and rate-limited responses',async()=>{
    vi.stubGlobal('fetch',vi.fn());await expect(searchPlaces('a')).rejects.toThrow(/3 and 120/);expect(fetch).not.toHaveBeenCalled();
    expect(parsePlaces({places:[]})).toEqual([]);expect(()=>parsePlaces({})).toThrow(/unavailable/);
    fetch.mockResolvedValueOnce({ok:false,status:429}).mockResolvedValueOnce({ok:false,status:503});
    await expect(searchPlaces('Daveyton')).rejects.toThrow(/wait a minute/);await expect(searchPlaces('Benoni')).rejects.toThrow(/temporarily unavailable/);
  });
});
describe('optional device location',()=>{
  it('gets one fresh high-accuracy suggestion only when called',async()=>{
    const getCurrentPosition=vi.fn(success=>success({coords:{latitude:-25.72,longitude:28.24,accuracy:10}}));
    expect(await requestDeviceLocation({secure:true,geolocation:{getCurrentPosition}})).toMatchObject({latitude:-25.72,imprecise:false});
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function),expect.any(Function),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
  });
  it.each([[1,/permission/],[2,/could not find/],[3,/too long/]])('handles device failure %s without requiring location access',async(code,message)=>{
    await expect(requestDeviceLocation({secure:true,geolocation:{getCurrentPosition:(_success,error)=>error({code})}})).rejects.toThrow(message);
  });
  it('rejects unsupported browsers and insecure contexts without requesting permission',async()=>{
    const getCurrentPosition=vi.fn();await expect(requestDeviceLocation({secure:false,geolocation:{getCurrentPosition}})).rejects.toThrow(/secure connection/);expect(getCurrentPosition).not.toHaveBeenCalled();
    await expect(requestDeviceLocation({secure:true,geolocation:{}})).rejects.toThrow(/cannot share/);
  });
  it('flags imprecise or unknown accuracy and rejects invalid device coordinates',async()=>{
    const get=coords=>requestDeviceLocation({secure:true,geolocation:{getCurrentPosition:success=>success({coords})}});
    expect((await get({latitude:0,longitude:0,accuracy:500})).imprecise).toBe(true);
    expect((await get({latitude:0,longitude:0})).imprecise).toBe(true);
    await expect(get({latitude:91,longitude:28,accuracy:10})).rejects.toThrow(/could not find/);
  });
});
