/* MaoMao local glTF 2.0 skin renderer. No package or CDN dependency.
   Supports embedded GLB buffers/images, indexed triangle primitives, rigid nodes,
   eight skin weights and quaternion LINEAR/STEP animation. Fixed camera and scale. */
(function(global){
  "use strict";
  const IDENTITY=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const clone=v=>new Float32Array(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
  function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
  function inverse(a){
    const rows=Array.from({length:4},(_,r)=>Array.from({length:8},(_,c)=>c<4?a[c*4+r]:+(c-4===r)));
    for(let i=0;i<4;i++){let p=i;for(let r=i+1;r<4;r++)if(Math.abs(rows[r][i])>Math.abs(rows[p][i]))p=r;if(Math.abs(rows[p][i])<1e-12)throw Error("Singular node matrix");[rows[i],rows[p]]=[rows[p],rows[i]];const d=rows[i][i];for(let c=0;c<8;c++)rows[i][c]/=d;for(let r=0;r<4;r++)if(r!==i){const f=rows[r][i];for(let c=0;c<8;c++)rows[r][c]-=f*rows[i][c];}}
    const out=new Float32Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++)out[c*4+r]=rows[r][c+4];return out;
  }
  function trs(t=[0,0,0],q=[0,0,0,1],s=[1,1,1]){
    const [x,y,z,w]=q,xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
    return new Float32Array([(1-2*(yy+zz))*s[0],2*(xy+wz)*s[0],2*(xz-wy)*s[0],0,2*(xy-wz)*s[1],(1-2*(xx+zz))*s[1],2*(yz+wx)*s[1],0,2*(xz+wy)*s[2],2*(yz-wx)*s[2],(1-2*(xx+yy))*s[2],0,...t,1]);
  }
  function qmul(a,b){return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
  function axis(axis,angle){const h=angle*.5;return[axis[0]*Math.sin(h),axis[1]*Math.sin(h),axis[2]*Math.sin(h),Math.cos(h)];}
  function slerp(a,b,t){let d=a.reduce((n,x,i)=>n+x*b[i],0),bb=b;if(d<0){bb=b.map(v=>-v);d=-d;}if(d>.9995)return norm(a.map((v,i)=>v+(bb[i]-v)*t));const theta=Math.acos(clamp(d,-1,1)),sn=Math.sin(theta),wa=Math.sin((1-t)*theta)/sn,wb=Math.sin(t*theta)/sn;return a.map((v,i)=>v*wa+bb[i]*wb);}
  function transform(m,p){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
  function viewMatrix(camera={}){const eye=camera.eye||[.88,.37,.68],target=camera.target||[0,.15,0],z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross(camera.up||[0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function ortho(l,r,b,t,n=.01,f=10){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
  function parseGLB(buffer){
    const view=new DataView(buffer);if(view.byteLength<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error("Invalid glTF 2 GLB");
    let json,bin;for(let off=12;off+8<=buffer.byteLength;){const length=view.getUint32(off,true),kind=view.getUint32(off+4,true);off+=8;if(off+length>buffer.byteLength)throw Error("Truncated GLB chunk");if(kind===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,off,length)).trim());if(kind===0x004e4942)bin=new Uint8Array(buffer,off,length);off+=length;}
    if(!json||!bin)throw Error("GLB must embed JSON and binary");if(json.buffers?.some(b=>b.uri))throw Error("External buffers are not allowed");if(json.extensionsRequired?.length)throw Error("Compressed/required glTF extensions are unsupported");
    return{gltf:json,bin,buffer};
  }
  const COMPONENTS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},TYPES={5120:[1,'getInt8'],5121:[1,'getUint8'],5122:[2,'getInt16'],5123:[2,'getUint16'],5125:[4,'getUint32'],5126:[4,'getFloat32']};
  function accessor(asset,index,integer=false){
    const a=asset.gltf.accessors[index],v=asset.gltf.bufferViews[a.bufferView],type=TYPES[a.componentType],size=COMPONENTS[a.type];if(!a||!v||!type||!size||a.sparse)throw Error("Unsupported glTF accessor");
    const stride=v.byteStride||type[0]*size,start=asset.bin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),view=new DataView(asset.buffer),out=integer?new Uint32Array(a.count*size):new Float32Array(a.count*size);
    for(let i=0;i<a.count;i++)for(let c=0;c<size;c++){let value=view[type[1]](start+i*stride+c*type[0],true);if(a.normalized&&a.componentType!==5126)value=a.componentType===5121?value/255:a.componentType===5123?value/65535:a.componentType===5120?Math.max(-1,value/127):Math.max(-1,value/32767);out[i*size+c]=value;}return out;
  }
  function sample(times,values,t,size,rotation,step=false){let lo=0,hi=times.length-1;if(t<=times[0])return Array.from(values.slice(0,size));if(t>=times[hi])return Array.from(values.slice(hi*size,(hi+1)*size));while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=t)lo=mid;else hi=mid;}const u=step?0:(t-times[lo])/(times[hi]-times[lo]),a=Array.from(values.slice(lo*size,(lo+1)*size)),b=Array.from(values.slice(hi*size,(hi+1)*size));return rotation?slerp(a,b,u):a.map((v,i)=>v+(b[i]-v)*u);}
  function prepare(asset){
    const g=asset.gltf;asset.base=g.nodes.map(n=>({translation:n.translation||[0,0,0],rotation:n.rotation||[0,0,0,1],scale:n.scale||[1,1,1],weights:n.weights||(n.mesh===undefined?[]:g.meshes[n.mesh].weights)||[],matrix:n.matrix}));asset.names=new Map(g.nodes.map((n,i)=>[n.name,i]));
    asset.clips=new Map((g.animations||[]).map(a=>{const channels=a.channels.map(ch=>{const s=a.samplers[ch.sampler];if(s.interpolation&&s.interpolation!=='LINEAR'&&s.interpolation!=='STEP')throw Error("Unsupported animation interpolation");const times=accessor(asset,s.input),values=accessor(asset,s.output);const size=ch.target.path==='weights'?values.length/times.length:COMPONENTS[g.accessors[s.output].type];if(!Number.isInteger(size)||size<1)throw Error('Invalid animation output');return{node:ch.target.node,path:ch.target.path,times,values,size,step:s.interpolation==='STEP'};});return[a.name,{channels,extras:a.extras||{},duration:Math.max(...channels.map(c=>c.times[c.times.length-1]))}];}));
    asset.ibms=(g.skins||[]).map(s=>s.inverseBindMatrices===undefined?new Float32Array(s.joints.flatMap(()=>Array.from(IDENTITY))):accessor(asset,s.inverseBindMatrices));
    const pos=g.meshes.flatMap(m=>m.primitives.map(p=>g.accessors[p.attributes.POSITION]));const min=[0,1,2].map(i=>Math.min(...pos.map(p=>p.min?.[i]??-.2))),max=[0,1,2].map(i=>Math.max(...pos.map(p=>p.max?.[i]??.35)));asset.bounds={min,max};return asset;
  }
  // Keep only a few completed assets. Live renderers own their assets independently;
  // eviction must not close a bitmap that an on-screen pet may still be using.
  function resourceCache(limit){
    const entries=new Map();
    const trim=()=>{let count=Array.from(entries.values()).filter(entry=>entry.ready).length;for(const [key,entry] of entries){if(count<=limit)break;if(entry.ready){entries.delete(key);count--;}}};
    return{get(key,start){const hit=entries.get(key);if(hit){entries.delete(key);entries.set(key,hit);return hit.promise;}
      const entry={ready:false,promise:null};entry.promise=Promise.resolve().then(start).then(value=>{entry.ready=true;trim();return value;},error=>{if(entries.get(key)===entry)entries.delete(key);throw error;});entries.set(key,entry);return entry.promise;
    },info(){return{limit,ready:Array.from(entries.values()).filter(entry=>entry.ready).length,pending:Array.from(entries.values()).filter(entry=>!entry.ready).length};}};
  }
  const assetCache=resourceCache(3),imageCache=resourceCache(8);
  const sameOrigin=url=>{const resolved=new URL(url,global.location?.href||'http://localhost/');if(global.location&&resolved.origin!==global.location.origin)throw Error("Pet resource must be same-origin");return resolved;};
  async function decodeImage(blob){
    if(typeof createImageBitmap==='function')return createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none'});
    const im=new Image(),src=URL.createObjectURL(blob);try{im.src=src;await im.decode();return im;}finally{URL.revokeObjectURL(src);}
  }
  async function load(url){
    const resolved=sameOrigin(url);return assetCache.get(resolved.href,async()=>{const response=await fetch(resolved.href,{credentials:'same-origin'});if(!response.ok)throw Error("Pet model HTTP "+response.status);const asset=prepare(parseGLB(await response.arrayBuffer()));asset.url=resolved.href;
      asset.images=await Promise.all((asset.gltf.images||[]).map(async(image,index)=>{
        if(image.bufferView!==undefined){const key=resolved.href+'#embedded-image-'+index;return imageCache.get(key,()=>{const v=asset.gltf.bufferViews[image.bufferView],bytes=asset.bin.slice(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);return decodeImage(new Blob([bytes],{type:image.mimeType||'image/png'}));});}
        if(!image.uri)throw Error("Missing pet texture");const imageURL=sameOrigin(new URL(image.uri,resolved).href).href;
        return imageCache.get(imageURL,async()=>{const r=await fetch(imageURL,{credentials:'same-origin'});if(!r.ok)throw Error("Pet texture HTTP "+r.status);return decodeImage(await r.blob());});
      }));return asset;});
  }
  const VS=`#version 300 es
  precision highp float;in vec3 a_position;in vec3 a_normal;in vec2 a_uv;in vec4 a_joints;in vec4 a_weights;in vec4 a_joints1;in vec4 a_weights1;
  in vec4 a_color;in vec3 a_morphPosition;in vec3 a_morphNormal;in vec3 a_morphPosition1;in vec3 a_morphNormal1;in vec3 a_morphPosition2;in vec3 a_morphNormal2;in vec3 a_morphPosition3;in vec3 a_morphNormal3;
  uniform mat4 u_viewProjection,u_model;uniform mat3 u_normalMatrix;uniform mat4 u_joints[JOINT_COUNT];uniform bool u_skinned;uniform vec4 u_morph;
  out vec3 v_normal;out vec3 v_world;out vec2 v_uv;out vec4 v_color;
  void main(){mat4 skin=mat4(1.0);if(u_skinned){float total=dot(a_weights,vec4(1.0))+dot(a_weights1,vec4(1.0));if(total>0.0)skin=(u_joints[int(a_joints.x)]*a_weights.x+u_joints[int(a_joints.y)]*a_weights.y+u_joints[int(a_joints.z)]*a_weights.z+u_joints[int(a_joints.w)]*a_weights.w+u_joints[int(a_joints1.x)]*a_weights1.x+u_joints[int(a_joints1.y)]*a_weights1.y+u_joints[int(a_joints1.z)]*a_weights1.z+u_joints[int(a_joints1.w)]*a_weights1.w)/total;}
    vec4 world=u_model*skin*vec4(a_position+a_morphPosition*u_morph.x+a_morphPosition1*u_morph.y+a_morphPosition2*u_morph.z+a_morphPosition3*u_morph.w,1.0);v_world=world.xyz;v_normal=normalize(u_normalMatrix*mat3(skin)*(a_normal+a_morphNormal*u_morph.x+a_morphNormal1*u_morph.y+a_morphNormal2*u_morph.z+a_morphNormal3*u_morph.w));v_uv=a_uv;v_color=a_color;gl_Position=u_viewProjection*world;}`;
  const FS=`#version 300 es
  precision highp float;in vec3 v_normal;in vec3 v_world;in vec2 v_uv;in vec4 v_color;
  uniform sampler2D u_base,u_normal,u_rm;uniform vec4 u_color;uniform vec3 u_eye,u_light;uniform float u_normalScale,u_alphaCutoff,u_metallic,u_roughness;uniform bool u_hasBase,u_hasNormal,u_hasRM,u_alphaMask,u_alphaBlend;
  out vec4 outColor;
  void main(){vec4 texel=u_hasBase?texture(u_base,v_uv):vec4(1.0),factor=u_color*v_color;vec4 base=vec4(pow(max(texel.rgb,vec3(0.0)),vec3(2.2))*factor.rgb,texel.a*factor.a);if(u_alphaMask&&base.a<u_alphaCutoff)discard;if(!u_alphaBlend)base.a=1.0;
    vec3 N=normalize(v_normal);if(!gl_FrontFacing)N=-N;
    if(u_hasNormal){vec3 p1=dFdx(v_world),p2=dFdy(v_world);vec2 uv1=dFdx(v_uv),uv2=dFdy(v_uv);float determinant=uv1.x*uv2.y-uv1.y*uv2.x;
      if(abs(determinant)>0.0000001){vec3 T=normalize((p1*uv2.y-p2*uv1.y)/determinant),B=normalize((-p1*uv2.x+p2*uv1.x)/determinant);vec3 map=texture(u_normal,v_uv).xyz*2.0-1.0;map.xy*=u_normalScale;N=normalize(mat3(T,B,N)*map);}}
    vec3 L=normalize(u_light),V=normalize(u_eye-v_world),H=normalize(L+V);vec4 rm=u_hasRM?texture(u_rm,v_uv):vec4(1.0);float rough=clamp(u_roughness*rm.g,.18,1.0),metal=clamp(u_metallic*rm.b,0.0,1.0);
    float light=.69+.16*max(N.y,0.0)+.27*max(dot(N,L),0.0);float spec=pow(max(dot(N,H),0.0),mix(80.0,8.0,rough))*(.025+.10*metal);
    vec3 linear=max(base.rgb,vec3(0.0))*light+spec;outColor=vec4(pow(max(linear,vec3(0.0)),vec3(1.0/2.2)),base.a);}`;
  function program(gl,vs,fs){const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((kind,i)=>{const s=gl.createShader(kind);gl.shaderSource(s,i?fs:vs);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;});const p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}

  const CLIP_NAMES={idle:['idle_breathe','idle'],run:['run','run_cycle','run_loop','run_cycle_60','Zoo_Run','gallop'],look:['look_around','head_look'],tilt:['head_tilt'],up:['head_look_up'],ear:['ear_listen','ear_flick'],tail:['tail_swish','tail_sway'],paw:['paw_offer'],tap:['paw_tap'],rub:['pet_rub_head'],settle:['settle_head'],curious:['curious_look'],eyesLeft:['eyes_track_left'],eyesRight:['eyes_track_right'],blink:['eyes_blink_source_fur','blink','eye_blink']};
  const clipFor=(asset,mode)=>[asset.gltf?.extras?.runtime_clips?.[mode],...(CLIP_NAMES[mode]||[mode])].find(name=>typeof name==='string'&&asset.clips.has(name));
  // A glTF may store many corrective targets, while WebGL2 exposes four paired morph slots.
  function selectMorphTargets(weights,targetCount,limit=4){
    const indices=[],values=[];for(let i=0;i<targetCount;i++){const value=weights?.[i],w=value==null?0:Number(value);if(!Number.isFinite(w))throw Error('Invalid morph coefficient at target '+i);if(Math.abs(w)>1e-8){indices.push(i);values.push(w);}}
    if(indices.length>limit)throw Error('Morph frame rejected: '+indices.length+' active targets exceed '+limit+' paired slots');
    while(indices.length<limit){indices.push(-1);values.push(0);}return{indices,weights:values};
  }
  class Renderer {
    constructor(host,asset,options={}){
      this.host=host;this.asset=asset;this.options=options;this.staged=!!options.staged;this.canvas=document.createElement('canvas');this.canvas.className='pet-model3d-canvas';this.canvas.setAttribute('aria-hidden','true');this.canvas.hidden=true;
      this.destroyed=false;this.active=false;this.time=0;this.lastTime=0;this.lastMode='idle';this.actionTime=-100;this.lastToken=null;this.gaze=[0,0];this.smoothRot=asset.base.map(n=>Array.from(n.rotation));this.camera=options.referenceCamera||asset.gltf.extras?.runtime_camera||{};this.view=viewMatrix(this.camera);this.raf=0;this.stats={kind:'gltf-skinned',joints:Math.max(0,...(asset.gltf.skins||[]).map(s=>s.joints.length)),clips:asset.clips.size,triangles:0,frames:0,fps:0,url:asset.url,mode:'idle'};
      this.lost=e=>{e.preventDefault();this.active=false;this.canvas.hidden=true;this.lastTime=0;options.onFallback?.('context-lost');};this.restored=()=>{if(this.destroyed)return;try{this.initGPU();this.active=true;this.draw(this.lastFrame||{});}catch(e){this.failure(e);}};
      this.canvas.addEventListener('webglcontextlost',this.lost);this.canvas.addEventListener('webglcontextrestored',this.restored);host.append(this.canvas);
      try{this.initGPU();this.active=true;if(!this.draw({now:performance.now(),mode:'idle'}))throw Error(this.error||'Could not render the pet model');}catch(e){this.destroy();throw e;}
      if(options.auto)this.start();
    }
    initGPU(){
      const gl=this.canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL2 unavailable');this.gl=gl;
      const jointCount=Math.max(1,this.stats.joints);if(jointCount*4+24>gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS))throw Error('Insufficient skin uniforms');if(gl.MAX_VERTEX_ATTRIBS!==undefined&&gl.getParameter(gl.MAX_VERTEX_ATTRIBS)<16)throw Error('Sixteen vertex attributes are required for eight skin influences');
      this.program=program(gl,VS.replace('JOINT_COUNT',String(jointCount)),FS);gl.useProgram(this.program);this.locations={};for(const n of ['viewProjection','model','normalMatrix','joints[0]','skinned','morph','base','normal','rm','color','normalScale','alphaCutoff','metallic','roughness','eye','light','hasBase','hasNormal','hasRM','alphaMask','alphaBlend'])this.locations[n]=gl.getUniformLocation(this.program,'u_'+n);
      this.whiteTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.whiteTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      this.textures=(this.asset.gltf.textures||[]).map(t=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.asset.images[t.source]);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);const s=this.asset.gltf.samplers?.[t.sampler]||{};gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,s.wrapS||gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,s.wrapT||gl.REPEAT);gl.generateMipmap(gl.TEXTURE_2D);return texture;});
      this.buffers=[];this.attributeBuffers=new Map();this.primitives=[];this.stats.triangles=0;this.morphLocations=Array.from({length:4},(_,i)=>({POSITION:gl.getAttribLocation(this.program,'a_morphPosition'+(i||'')),NORMAL:gl.getAttribLocation(this.program,'a_morphNormal'+(i||''))}));
      this.asset.gltf.nodes.forEach((node,nodeIndex)=>{if(node.mesh===undefined)return;for(const p of this.asset.gltf.meshes[node.mesh].primitives){if(p.mode!==undefined&&p.mode!==4)throw Error('Only triangle primitives are supported');const vao=gl.createVertexArray();gl.bindVertexArray(vao);const count=this.asset.gltf.accessors[p.attributes.POSITION].count;
        if((p.attributes.JOINTS_1===undefined)!==(p.attributes.WEIGHTS_1===undefined))throw Error('Secondary skin joints and weights must be paired');
        for(const [name,semantic,size,defaultValue] of [['position','POSITION',3,[0,0,0]],['normal','NORMAL',3,[0,1,0]],['uv','TEXCOORD_0',2,[0,0]],['joints','JOINTS_0',4,[0,0,0,0]],['weights','WEIGHTS_0',4,[1,0,0,0]],['joints1','JOINTS_1',4,[0,0,0,0]],['weights1','WEIGHTS_1',4,[0,0,0,0]],['color','COLOR_0',4,[1,1,1,1]],['morphPosition','MORPH_POSITION',3,[0,0,0]],['morphNormal','MORPH_NORMAL',3,[0,0,0]],['morphPosition1','MORPH1_POSITION',3,[0,0,0]],['morphNormal1','MORPH1_NORMAL',3,[0,0,0]],['morphPosition2','MORPH2_POSITION',3,[0,0,0]],['morphNormal2','MORPH2_NORMAL',3,[0,0,0]],['morphPosition3','MORPH3_POSITION',3,[0,0,0]],['morphNormal3','MORPH3_NORMAL',3,[0,0,0]]]){
          const location=gl.getAttribLocation(this.program,'a_'+name);if(location<0)continue;const morphSemantic=/^MORPH([123]?)_(.+)$/.exec(semantic),index=morphSemantic?p.targets?.[+(morphSemantic[1]||0)]?.[morphSemantic[2]]:p.attributes[semantic];if(index===undefined){gl.disableVertexAttribArray(location);gl.vertexAttrib4f(location,defaultValue[0]||0,defaultValue[1]||0,defaultValue[2]||0,defaultValue.length===4?defaultValue[3]:1);continue;}let values=accessor(this.asset,index);if(name==='color'&&index!==undefined&&this.asset.gltf.accessors[index].type==='VEC3'){const rgba=new Float32Array(count*4);for(let i=0;i<count;i++)rgba.set([values[i*3],values[i*3+1],values[i*3+2],1],i*4);values=rgba;}const buffer=gl.createBuffer();this.buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);this.attributeBuffers.set(index,buffer);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
        }
        let indexCount=count,indexed=false;if(p.indices!==undefined){const indices=accessor(this.asset,p.indices,true),buffer=gl.createBuffer();this.buffers.push(buffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);indexCount=indices.length;indexed=true;}
        this.primitives.push({vao,node:nodeIndex,skin:node.skin,material:this.asset.gltf.materials?.[p.material]||{},count:indexCount,indexed,targets:p.targets||[],morphSlots:[0,1,2,3]});this.stats.triangles+=indexCount/3;
      }});gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
      const reference=this.camera.reference_bounds||this.options.referenceBounds||this.asset.bounds,corners=[];for(let x of [reference.min[0],reference.max[0]])for(let y of [reference.min[1],reference.max[1]])for(let z of [reference.min[2],reference.max[2]])corners.push(transform(this.view,[x,y,z]));
      this.fitMin=Math.min(...corners.map(p=>p[1]));this.fitMax=Math.max(...corners.map(p=>p[1]));this.fitCenterX=(Math.min(...corners.map(p=>p[0]))+Math.max(...corners.map(p=>p[0])))/2;
    }
    failure(error){this.active=false;this.canvas.hidden=true;this.error=String(error);this.options.onFallback?.(this.error);}
    pose(frame,dt){
      const requested=frame.mode||'idle',token=frame.token??requested,changed=requested!==this.lastMode||token!==this.lastToken;
      if(changed)this.modeStarted=this.time;if(['paw','tap'].includes(requested)&&changed)this.actionTime=this.time;this.lastToken=token;this.lastMode=requested;
      const modeTime=Math.max(0,this.time-(this.modeStarted||0));
      const pose=this.asset.base.map(n=>({translation:Array.from(n.translation),rotation:Array.from(n.rotation),scale:Array.from(n.scale),weights:Array.from(n.weights||[]),matrix:n.matrix}));
      const animatedWeightNodes=new Set();const apply=(name,t,loop=true)=>{const clip=this.asset.clips.get(name);if(!clip)return;const sampleTime=loop?(t%clip.duration+clip.duration)%clip.duration:clamp(t,0,clip.duration);for(const ch of clip.channels){const rot=ch.path==='rotation',size=ch.size||(rot?4:3);pose[ch.node][ch.path]=sample(ch.times,ch.values,sampleTime,size,rot,ch.step);if(ch.path==='weights')animatedWeightNodes.add(ch.node);}};
      const idleClip=clipFor(this.asset,'idle');if(idleClip)apply(idleClip,frame.reduce?0:this.time);
      const selectedClip=clipFor(this.asset,requested),selected=this.asset.clips.get(selectedClip),oneShot=selected?.extras?.loop===false||['paw','tap','settle','blink','eyesLeft','eyesRight'].includes(requested);
      if(selectedClip&&requested!=='idle'&&!frame.reduce&&!(requested==='look'&&frame.gaze))apply(selectedClip,modeTime,!oneShot);
      this.stats.activeClip=requested==='look'&&frame.gaze?'interactive_gaze':selectedClip||idleClip||null;this.stats.availableModes=Object.keys(CLIP_NAMES).filter(mode=>clipFor(this.asset,mode));
      const paw=selected&&['paw','tap'].includes(requested)?selected:null;
      const gaze=frame.gaze||[0,0],alpha=1-Math.exp(-dt*25);for(let i=0;i<2;i++)this.gaze[i]+=(clamp(gaze[i]||0,-1,1)-this.gaze[i])*alpha;
      // Each rig may describe its own local forward/up and safe angle limits.
      // New models are not interpreted using the old cat's +X eye axis.
      const rotate=(name,defaultYaw,defaultPitch)=>{const index=this.asset.names.get(name);if(index===undefined)return;const meta=this.asset.gltf.nodes[index].extras||{},config=this.asset.gltf.extras?.runtime_controls?.[name]||{},forward=meta.forward_local_xyz||config.forward_local_xyz;
        if(meta.enabled===false||config.enabled===false)return;
        const yaw=(meta.max_yaw_degrees??config.max_yaw_degrees??defaultYaw)*Math.PI/180,pitch=(meta.max_pitch_degrees??config.max_pitch_degrees??defaultPitch)*Math.PI/180;
        if(forward){const f=norm(forward),right=[this.view[0],this.view[4],this.view[8]],up=norm(meta.up_local_xyz||config.up_local_xyz||[0,1,0]);const desired=norm(f.map((v,i)=>v+right[i]*this.gaze[0]*Math.tan(yaw)-up[i]*this.gaze[1]*Math.tan(pitch))),c=cross(f,desired),aim=norm([...c,1+dot(f,desired)]);pose[index].rotation=qmul(pose[index].rotation,aim);}
        else{const yawAxis=meta.yaw_axis_local_xyz||config.yaw_axis_local_xyz||[0,1,0],pitchAxis=meta.pitch_axis_local_xyz||config.pitch_axis_local_xyz||[0,0,1];pose[index].rotation=qmul(pose[index].rotation,qmul(axis(norm(yawAxis),this.gaze[0]*yaw),axis(norm(pitchAxis),-this.gaze[1]*pitch)));}
      };
      if(requested!=='run'||!selected){rotate('neck',1.4,1);rotate('head',5,3.4);
        if(!['eyesLeft','eyesRight'].includes(requested))for(const eye of ['eye.L','eye.R','eye_pivot.L','eye_pivot.R'])rotate(eye,3,2);}
      this.currentWeights=pose.map(p=>Array.from(p.weights||[]));
      const blinkPhase=(this.time+3)%5.8,autoBlink=this.asset.gltf.extras?.runtime_eyes?.auto_blink_validated===true;
      const blink=Number.isFinite(frame.blink)?clamp(frame.blink,0,1):(!autoBlink||frame.reduce?0:blinkPhase<.2?Math.sin(blinkPhase/.2*Math.PI):0);
      const eyeClosure=side=>Number.isFinite(frame['blink'+side])?clamp(frame['blink'+side],0,1):blink,manualEye=side=>frame.blink!==undefined||Number.isFinite(frame['blink'+side]);
      for(const name of ['eye_lids.L','eye_lids.R']){const side=name.endsWith('.L')?'L':'R',i=this.asset.names.get(name);if(i!==undefined&&!(animatedWeightNodes.has(i)&&!manualEye(side))){const node=this.asset.gltf.nodes[i],targets=this.asset.gltf.meshes[node.mesh]?.primitives[0]?.targets?.length||1,blinkIndex=node.extras?.blink_morph_index??0,clearanceIndex=node.extras?.clearance_morph_index??1,weights=Array.from(this.currentWeights[i]||[]);while(weights.length<targets)weights.push(0);weights[blinkIndex]=eyeClosure(side);if(targets>=2)weights[clearanceIndex]=Math.sin(Math.PI*eyeClosure(side));this.currentWeights[i]=weights;}}
      // A closed fur lid and its original iris surface must move in the same frame.
      // Preserve any other corrective coefficients on the orbital mesh.
      this.asset.gltf.nodes.forEach((node,i)=>{const side=node.extras?.blink_side||(/\.L$/.test(node.name||'')?'L':'R'),index=node.extras?.blink_retract_morph_index;if(!Number.isInteger(index)||index<0||animatedWeightNodes.has(i)&&!manualEye(side))return;const targets=this.asset.gltf.meshes[node.mesh]?.primitives[0]?.targets?.length||0;if(index>=targets)return;const weights=Array.from(this.currentWeights[i]||[]);while(weights.length<targets)weights.push(0);weights[index]=eyeClosure(side)**3;this.currentWeights[i]=weights;});
      // Corrective skin poses sample all channels atomically: smoothing only bones would put the morphs out of phase.
      const exactMotion=requested==='run'&&!!selected,blend=exactMotion||selected?.extras?.requires_corrective_targets?1:(dt?1-Math.exp(-dt*18):1);pose.forEach((p,i)=>{this.smoothRot[i]=slerp(this.smoothRot[i],p.rotation,blend);p.rotation=this.smoothRot[i];});
      this.stats.mode=paw&&modeTime>=paw.duration?'idle':requested;this.lastPose=pose;
      const worlds=new Array(pose.length),visit=(index,parent)=>{const p=pose[index],local=p.matrix?new Float32Array(p.matrix):trs(p.translation,p.rotation,p.scale);worlds[index]=mul(parent,local);for(const child of this.asset.gltf.nodes[index].children||[])visit(child,worlds[index]);};
      const roots=this.asset.gltf.scenes?.[this.asset.gltf.scene||0]?.nodes||[0];roots.forEach(i=>visit(i,IDENTITY));for(let i=0;i<worlds.length;i++)if(!worlds[i])visit(i,IDENTITY);this.worlds=worlds;return worlds;
    }
    bindMorphTargets(primitive,selection){
      const gl=this.gl;gl.bindVertexArray(primitive.vao);
      for(let slot=0;slot<4;slot++){
        const index=selection.indices[slot];if(index===primitive.morphSlots[slot])continue;
        primitive.morphSlots[slot]=index;if(index<0)continue;
        const target=primitive.targets[index]||{};
        for(const semantic of ['POSITION','NORMAL']){
          const location=this.morphLocations[slot][semantic];if(location<0)continue;const accessorIndex=target[semantic];
          if(accessorIndex===undefined){gl.disableVertexAttribArray(location);gl.vertexAttrib4f(location,0,0,0,1);continue;}
          let buffer=this.attributeBuffers.get(accessorIndex);if(!buffer){buffer=gl.createBuffer();this.buffers.push(buffer);this.attributeBuffers.set(accessorIndex,buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,accessor(this.asset,accessorIndex),gl.STATIC_DRAW);}else gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
          gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
        }
      }
      gl.uniform4f(this.locations.morph,...selection.weights);return selection;
    }
    draw(frame={}){
      if(this.destroyed||!this.active)return false;this.lastFrame=frame;
      try{
        const now=Number.isFinite(frame.now)?frame.now:performance.now(),dt=this.lastTime?clamp((now-this.lastTime)/1000,0,.05):0;this.lastTime=now;this.time+=dt;
        const width=Math.max(1,this.host.clientWidth||240),height=Math.max(1,this.host.clientHeight||180),dpr=Math.min(global.devicePixelRatio||1,2);
        const gl=this.gl,loc=this.locations;
        const priorProjection=this.projection;const h=this.camera.world_span||(this.fitMax-this.fitMin)/(this.options.fill||.74),w=h*width/height,bottom=this.fitMin-h*(this.options.bottom||.012);this.projection=ortho(this.fitCenterX-w/2,this.fitCenterX+w/2,bottom,bottom+h);
        const saved={projection:priorProjection,smoothRot:this.smoothRot.map(q=>Array.from(q)),gaze:Array.from(this.gaze),lastPose:this.lastPose,worlds:this.worlds,currentWeights:this.currentWeights,modeStarted:this.modeStarted,lastMode:this.lastMode,lastToken:this.lastToken,actionTime:this.actionTime},savedStats={...this.stats};const worlds=this.pose(frame,dt);let morphSelections;
        try{morphSelections=this.primitives.map(p=>selectMorphTargets(this.currentWeights?.[p.node],p.targets.length));}
        catch(error){Object.assign(this,saved);this.stats={...savedStats,rejectedMorphFrames:(savedStats.rejectedMorphFrames||0)+1,lastRejectedReason:String(error)};this.lastFrame=this.completeFrame||frame;this.options.onRejected?.(String(error));return !!this.hasCompleteFrame;}
        // Validation precedes resizing/clearing: an unsupported frame retains the previous complete pet.
        if(this.canvas.width!==Math.round(width*dpr)||this.canvas.height!==Math.round(height*dpr)){this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);}
        gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.uniform3fv(loc.eye,this.camera.eye||[.88,.37,.68]);gl.uniform3fv(loc.light,this.asset.gltf.extras?.runtime_lighting?.direction||[.7,.9,1]);gl.uniformMatrix4fv(loc.viewProjection,false,mul(this.projection,this.view));
        for(let primitiveIndex=0;primitiveIndex<this.primitives.length;primitiveIndex++){const p=this.primitives[primitiveIndex];this.bindMorphTargets(p,morphSelections[primitiveIndex]);const model=worlds[p.node],inv=inverse(model),normal=new Float32Array([inv[0],inv[4],inv[8],inv[1],inv[5],inv[9],inv[2],inv[6],inv[10]]);gl.uniformMatrix4fv(loc.model,false,model);gl.uniformMatrix3fv(loc.normalMatrix,false,normal);gl.uniform1i(loc.skinned,p.skin===undefined?0:1);
          if(p.skin!==undefined){const skin=this.asset.gltf.skins[p.skin],ibms=this.asset.ibms[p.skin],palette=new Float32Array(skin.joints.length*16);skin.joints.forEach((node,i)=>palette.set(mul(inv,mul(worlds[node],ibms.subarray(i*16,i*16+16))),i*16));gl.uniformMatrix4fv(loc['joints[0]'],false,palette);}
          const m=p.material,pbr=m.pbrMetallicRoughness||{},base=pbr.baseColorTexture?.index,normalTex=m.normalTexture?.index,rm=pbr.metallicRoughnessTexture?.index;
          gl.uniform4fv(loc.color,pbr.baseColorFactor||[1,1,1,1]);gl.uniform1f(loc.metallic,pbr.metallicFactor??1);gl.uniform1f(loc.roughness,pbr.roughnessFactor??1);gl.uniform1f(loc.normalScale,m.normalTexture?.scale??.4);gl.uniform1f(loc.alphaCutoff,m.alphaCutoff??.5);gl.uniform1i(loc.alphaMask,m.alphaMode==='MASK');gl.uniform1i(loc.alphaBlend,m.alphaMode==='BLEND');
          for(const [unit,index,name] of [[0,base,'base'],[1,normalTex,'normal'],[2,rm,'rm']]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,index===undefined?this.whiteTexture:(this.textures[index]||this.whiteTexture));gl.uniform1i(loc[name],unit);gl.uniform1i(loc['has'+(name==='rm'?'RM':name[0].toUpperCase()+name.slice(1))],index!==undefined);}
          if(m.doubleSided)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);}gl.bindVertexArray(p.vao);if(p.indexed)gl.drawElements(gl.TRIANGLES,p.count,gl.UNSIGNED_INT,0);else gl.drawArrays(gl.TRIANGLES,0,p.count);
        }
        gl.bindVertexArray(null);if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL draw failed');this.canvas.hidden=this.staged;this.stats.frames++;if(!this.fpsAt)this.fpsAt=now;if(now-this.fpsAt>=1000){this.stats.fps=Math.round((this.stats.frames-(this.fpsFrames||0))*1000/(now-this.fpsAt));this.fpsAt=now;this.fpsFrames=this.stats.frames;}
        this.hasCompleteFrame=true;this.completeFrame={...frame};this.host.dataset.renderer='3d';this.host.dataset.modelJoints=String(this.stats.joints);return true;
      }catch(error){this.failure(error);return false;}
    }
    projectNode(name,offset=[0,0,0]){const index=this.asset.names.get(name);if(index===undefined||!this.worlds?.[index]||!this.projection)return null;const world=transform(this.worlds[index],offset),screen=transform(mul(this.projection,this.view),world);return{x:(screen[0]*.5+.5)*(this.host.clientWidth||240),y:(.5-screen[1]*.5)*(this.host.clientHeight||180)};}
    contactPoints(){const points=['fore_paw.L','fore_paw.R','eye.L','eye.R'].map(n=>this.projectNode(n)).filter(Boolean);if(!points.length){const head=this.projectNode('head');if(head)points.push(head);}return points;}
    start(){if(this.raf||this.destroyed)return;const frame=now=>{this.raf=0;if(this.destroyed)return;if(!document.hidden)this.draw({...this.lastFrame,now});else this.lastTime=0;this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);}
    destroy(){if(this.destroyed)return;this.destroyed=true;this.active=false;cancelAnimationFrame(this.raf);this.canvas.removeEventListener('webglcontextlost',this.lost);this.canvas.removeEventListener('webglcontextrestored',this.restored);const gl=this.gl;if(gl&&!gl.isContextLost()){this.buffers?.forEach(b=>gl.deleteBuffer(b));this.textures?.forEach(t=>gl.deleteTexture(t));if(this.whiteTexture)gl.deleteTexture(this.whiteTexture);this.primitives?.forEach(p=>gl.deleteVertexArray(p.vao));if(this.program)gl.deleteProgram(this.program);}this.canvas.remove();}
  }
  class Actor {
    constructor(host,reference,options={}){this.host=host;this.reference=reference;this.options=options;this.current=null;this.poseName=null;this.pending=null;this.serial=0;this.destroyed=false;this.lastFrame={};this.error=null;}
    async setPose(name){
      name=Pet3D.poseURLs[name]?name:'rigged';if(this.destroyed)return;if(this.poseName===name){if(this.pending&&this.pending.name!==name){this.serial++;this.pending=null;}return this.current;}if(this.pending?.name===name)return this.pending.promise;
      const serial=++this.serial,promise=(async()=>{try{const asset=await(name==='rigged'?Promise.resolve(this.reference):load(Pet3D.poseURLs[name]));if(asset.gltf.extras?.runtime_family&&this.reference.gltf.extras?.runtime_family&&asset.gltf.extras.runtime_family!==this.reference.gltf.extras.runtime_family)throw Error('Different pet model family');if(this.destroyed||serial!==this.serial)return;
        let next;next=new Renderer(this.host,asset,{...this.options,auto:false,staged:true,referenceBounds:this.reference.bounds,referenceCamera:this.reference.gltf.extras?.runtime_camera||{},onFallback:reason=>{if(this.current===next)this.options.onFallback?.(reason);}});
        if(this.destroyed||serial!==this.serial){next.destroy();return;}const rejectedBefore=next.stats.rejectedMorphFrames||0,ready=next.draw({...this.lastFrame,now:performance.now()});if(!ready||(next.stats.rejectedMorphFrames||0)>rejectedBefore){const error=Error(next.error||next.stats.lastRejectedReason||'Replacement pet frame is not ready');next.destroy();throw error;}const old=this.current;if(old?.canvas)old.canvas.hidden=true;this.current=next;this.poseName=name;this.pending=null;this.error=null;next.staged=false;next.canvas.hidden=false;old?.destroy();this.options.onPose?.(name,next);return next;
      }catch(error){if(serial===this.serial){this.pending=null;this.error=String(error);this.retryAt=performance.now()+5000;}if(!this.current)throw error;return this.current;}})();this.pending={name,promise};return promise;
    }
    draw(frame={}){if(this.destroyed)return false;this.lastFrame=frame;const requested=frame.pose||'rigged',wanted=Pet3D.poseURLs[requested]?requested:'rigged';if(this.error&&performance.now()<(this.retryAt||0))return this.current?.draw(frame)||false;if(wanted!==this.poseName&&!this.pending)this.setPose(wanted);else if(this.pending&&this.pending.name!==wanted)this.setPose(wanted);
      return this.current?.draw(frame)||false;
    }
    capture(){if(!this.current?.active)return null;this.current.draw({...this.lastFrame,now:performance.now()});const c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;c.getContext('2d').drawImage(this.canvas,0,0);return c;}
    projectNode(name,offset){return this.current?.projectNode(name,offset)||null;}
    contactPoints(){return this.current?.contactPoints()||[];}
    get hasEmbeddedBowl(){return !!this.current?.asset.gltf.extras?.contains_original_bowl;}get canvas(){return this.current?.canvas;}get active(){return !!this.current?.active;}get stats(){return{...this.current?.stats,pose:this.poseName,pendingPose:this.pending?.name||null};}
    destroy(){if(this.destroyed)return;const snapshot=this.capture();if(snapshot&&this.options.captureKey)Pet3D.lastFrames[this.options.captureKey]=snapshot;this.destroyed=true;this.serial++;this.current?.destroy();this.current=null;}
  }
  const Pet3D={modelURL:'/models/orange-cat/orange-tabby-r10.glb?v=6965bedd',poseURLs:{run:'/models/orange-cat/orange-zoo-run-r10.glb?v=5936e53b'},lastFrames:{},load,Renderer,Actor,cacheInfo(){return{assets:assetCache.info(),images:imageCache.info()};},
    async mount(host,options={}){if(options.breed&&options.breed!=='orange')return null;const reference=options.referenceURL?await load(options.referenceURL):null;return new Renderer(host,await load(options.url||Pet3D.modelURL),{...options,referenceBounds:options.referenceBounds||reference?.bounds,referenceCamera:options.referenceCamera||reference?.gltf.extras?.runtime_camera});},
    async mountActor(host,options={}){if(options.breed&&options.breed!=='orange')return null;const reference=await load(options.referenceURL||Pet3D.modelURL),actor=new Actor(host,reference,options);await actor.setPose(options.pose||'rigged');return actor;},
    configure(config){if(config.modelURL){Pet3D.modelURL=config.modelURL;Pet3D.poseURLs={...(config.poseURLs||{})};Pet3D.lastFrames={};}else if(config.poseURLs)Pet3D.poseURLs={...config.poseURLs};if(config.runURL!==undefined){if(config.runURL)Pet3D.poseURLs.run=config.runURL;else delete Pet3D.poseURLs.run;}return Pet3D;},preloadPose(name){const url=name==='rigged'?Pet3D.modelURL:Pet3D.poseURLs[name];return url?load(url):Promise.resolve(null);},math:{mul,inverse,trs,qmul,slerp,transform,parseGLB,accessor,prepare,sample,viewMatrix,ortho,clipFor,selectMorphTargets}};
  let configuredModelURL=Pet3D.modelURL;Object.defineProperty(Pet3D,'modelURL',{enumerable:true,get(){return configuredModelURL;},set(url){if(url!==configuredModelURL){configuredModelURL=url;Pet3D.poseURLs={};Pet3D.lastFrames={};}}});
  global.Pet3D=Pet3D;
  // Play continues to own its input clock, physical contact checks and quiet rewards.
  global.createPetPlayRenderer=async function({host,canvas,breed,fallback}){
    if(breed!=='orange')return null;let renderer;try{renderer=await Pet3D.mountActor(host,{breed,fill:.833,bottom:20/576,onFallback:()=>{canvas.style.visibility='visible';}});}catch{return null;}
    return{draw(frame){const active=frame.target?.active,gaze=active?[frame.motion.lookX||0,frame.motion.lookY||0]:[0,0],mode=frame.motion.mode==='reach'?'paw':active?'look':'idle';const ok=renderer.draw({now:frame.now,pose:'rigged',mode,gaze,token:frame.motion.actionId,reduce:frame.reduce});canvas.style.visibility=ok?'hidden':'visible';if(!ok)fallback?.draw(frame);return ok;},destroy(){renderer.destroy();canvas.style.visibility='visible';},contactPoints(){return renderer.contactPoints();},get stats(){return renderer.stats;},renderer};
  };
})(typeof window==='undefined'?globalThis:window);
