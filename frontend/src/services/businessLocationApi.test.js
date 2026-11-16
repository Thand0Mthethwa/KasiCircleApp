import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { businessService } from './api';
beforeEach(()=>{ localStorage.setItem('kasicircle_token','test-only-token');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({latitude:null,longitude:null,locationPublic:false})})); });
afterEach(()=>vi.unstubAllGlobals());
it('authenticates private reads, explicit updates and removal with the existing JWT',async()=>{
  await businessService.getLocation('owner-id');await businessService.saveLocation('owner-id',{latitude:0,longitude:0,locationPublic:false});await businessService.removeLocation('owner-id');
  expect(fetch.mock.calls.map(call=>call[1].method||'GET')).toEqual(['GET','PUT','DELETE']);
  for(const [url,options] of fetch.mock.calls){expect(url).toMatch(/\/api\/businesses\/owner-id\/location$/);expect(options.headers.Authorization).toBe('Bearer test-only-token');}
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({latitude:0,longitude:0,locationPublic:false});
});
it('uses established expired-session handling on an unauthorized private read',async()=>{
  fetch.mockResolvedValueOnce({ok:false,status:401,headers:{get:()=> 'application/json'},json:async()=>({message:'Authentication required'})});
  await expect(businessService.getLocation('id')).rejects.toMatchObject({status:401});expect(localStorage.getItem('kasicircle_token')).toBeNull();
});
