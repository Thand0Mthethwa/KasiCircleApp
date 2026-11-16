import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeSearchConfig, parsePlaces, searchPlaces } from './placeSearch';
import { requestDeviceLocation } from './deviceLocation';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
const configured={VITE_PLACE_SEARCH_ENABLED:'true',VITE_PLACE_SEARCH_URL:'/api/places/search',VITE_PLACE_SEARCH_ATTRIBUTION:'OpenStreetMap contributors',VITE_PLACE_SEARCH_ATTRIBUTION_URL:'https://www.openstreetmap.org/copyright'};
describe('approved place search',()=>{
  it('is disabled by default and rejects public endpoints, missing approval or missing credit',()=>{
    expect(placeSearchConfig({}).enabled).toBe(false);
    for(const change of [{VITE_PLACE_SEARCH_ENABLED:'false'},{VITE_PLACE_SEARCH_URL:'https://nominatim.openstreetmap.org/search'},{VITE_PLACE_SEARCH_URL:'//external/search'},{VITE_PLACE_SEARCH_URL:'/api/places?secret=bad'},{VITE_PLACE_SEARCH_ATTRIBUTION:''}]) expect(placeSearchConfig({...configured,...change}).enabled).toBe(false);
    expect(placeSearchConfig(configured).enabled).toBe(true);
  });
  it('uses explicit same-origin search, bounded results, no cache or redirects, and genuine valid provider coordinates',async()=>{
    const result={features:[{geometry:{type:'Point',coordinates:[28.2,-25.7]},properties:{name:'Taxi rank',city:'Pretoria'}},{geometry:{type:'Point',coordinates:[28,99]},properties:{name:'Bad'}},{geometry:{type:'Point',coordinates:[null,0]},properties:{name:'Missing'}},{geometry:{type:'Point',coordinates:[0,0]},properties:{}}]};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>result}));localStorage.setItem('kasicircle_token','test-session');
    expect(await searchPlaces(' Taxi rank ',{config:placeSearchConfig(configured)})).toEqual([{key:'0',label:'Taxi rank, Pretoria',latitude:-25.7,longitude:28.2}]);
    expect(fetch).toHaveBeenCalledWith('/api/places/search?q=Taxi+rank&limit=5',expect.objectContaining({cache:'no-store',redirect:'error',credentials:'same-origin',headers:{Authorization:'Bearer test-session'}}));
  });
  it('never requests an unconfigured provider or a very short query and reports unavailable responses',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));
    await expect(searchPlaces('Soweto',{config:placeSearchConfig({})})).rejects.toThrow(/not available/);expect(fetch).not.toHaveBeenCalled();
    await expect(searchPlaces('a',{config:placeSearchConfig(configured)})).rejects.toThrow(/3 and 120/);expect(fetch).not.toHaveBeenCalled();
    await expect(searchPlaces('Soweto',{config:placeSearchConfig(configured)})).rejects.toThrow(/unavailable/);
    expect(()=>parsePlaces({})).toThrow(/unreadable/);
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
