import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { userService } from './api';
const profile={ id:'member', profileImageUrl:'https://images.example.test/avatar.png' };
beforeEach(()=>{
  localStorage.setItem('kasicircle_token','test-session');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>profile}));
});
afterEach(()=>vi.unstubAllGlobals());
it('uploads multipart without overriding the browser boundary and preserves authentication',async()=>{
  const image=new File(['image'],'avatar.webp',{type:'image/webp'});
  expect(await userService.uploadProfileImage(image)).toEqual(profile);
  const [url,options]=fetch.mock.calls[0];expect(url).toMatch(/\/api\/users\/me\/profile-image$/);
  expect(options.method).toBe('POST');expect(options.headers).toEqual({Authorization:'Bearer test-session'});
  expect(options.body.get('file')).toEqual(image);expect(localStorage.getItem('kasicircle_token')).toBe('test-session');
});
it('removes only the authenticated account avatar and returns refreshed metadata',async()=>{
  await userService.removeProfileImage();expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/users\/me\/profile-image$/),expect.objectContaining({method:'DELETE',headers:expect.objectContaining({Authorization:'Bearer test-session'})}));
});
it('uses the existing expired-session handling on unauthorized upload',async()=>{
  fetch.mockResolvedValueOnce({ok:false,status:401,headers:{get:()=> 'application/json'},json:async()=>({message:'Authentication required'})});
  const event=vi.fn();window.addEventListener('kasicircle:unauthorized',event);
  try {await expect(userService.uploadProfileImage(new File(['x'],'x.png',{type:'image/png'}))).rejects.toMatchObject({status:401});expect(event).toHaveBeenCalledOnce();expect(localStorage.getItem('kasicircle_token')).toBeNull();}
  finally {window.removeEventListener('kasicircle:unauthorized',event);}
});
