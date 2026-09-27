(function(){
  "use strict";

  // ---------- vendored: LZ-String 1.5.0 (MIT, pieroxy) — used to shrink share links ----------
  var LZString=function(){var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();

  // ---------- vendored: qrcode-generator 2.0.4 (MIT, Kazuhiko Arase) — used to draw share QR codes ----------
  var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,(function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1}))},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(o*r,n*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)};

  var COLORS = {
    amber:'#e8b84b', rose:'#e08a92', sky:'#7ca8d9', sage:'#7fc29a',
    lilac:'#c793d9', clay:'#e0925c', aqua:'#6fc8c0', olive:'#b7c77a',
    coral:'#f2836b', mint:'#8fd9b6', indigo:'#8f93d9', gold:'#e0c15c',
    plum:'#b06aa8', steel:'#7d97ad', berry:'#d15a7a', forest:'#6b9e5e'
  };
  var COLOR_KEYS = Object.keys(COLORS);
  var CURRENCIES = {UAH:'₴', USD:'$', EUR:'€', GBP:'£', PLN:'zł', RUB:'₽'};
  var CURRENCY_KEYS = Object.keys(CURRENCIES);
  var DEFAULT_CURRENCY = 'UAH';
  var DOW_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  var DOW_VALUES = [1,2,3,4,5,6,0];
  var STORAGE_KEY = 'lessoncal_boards_v1';
  var THEME_KEY = 'lessoncal_theme';

  function getTheme(){
    try{ return localStorage.getItem(THEME_KEY)==='light' ? 'light' : 'dark'; }
    catch(e){ return 'dark'; }
  }
  function setTheme(t){
    var theme = (t==='light') ? 'light' : 'dark';
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    render();
  }

  var state = {
    boards: [],
    activeBoardId: null,
    viewDate: startOfMonth(todayD()),
    selectedDate: null,
    modal: null,
    menuOpen: false,
    storageOk: true,
    pendingImport: null,
    newBoardType: 'lessons',
    financeView: 'income',
    theme: getTheme(),
    editing: null,
    transactionTarget: null,
    boardTypePickerOpen: false,
    scheduleDay: (function(){ var jd = new Date().getDay(); return jd; })(),
    scheduleTimeTarget: null
  };

  // ---------- date helpers ----------
  function pad(n){ return String(n).padStart(2,'0'); }
  function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseD(s){ var p=s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function todayD(){ var n=new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function addDays(d,n){ var r=new Date(d); r.setDate(r.getDate()+n); return r; }
  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  var MONTH_NAMES_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  function fmtHuman(ds){
    var d = parseD(ds);
    return d.getDate()+' '+MONTH_NAMES_GEN[d.getMonth()]+' '+d.getFullYear();
  }
  function fmtHumanNoYear(ds){
    var d = parseD(ds);
    return d.getDate()+' '+MONTH_NAMES_GEN[d.getMonth()];
  }
  function timeRangeStr(s){
    if(!s.timeStart) return '';
    return s.timeStart + (s.timeEnd ? '–'+s.timeEnd : '');
  }
  var MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  var BOARD_TYPES = ['lessons','events','finance','schedule'];
  var BOARD_TYPE_LABELS = {lessons:'Занятия', events:'События', finance:'Финансы', schedule:'Расписание'};
  function normBoardType(t){ return BOARD_TYPES.indexOf(t)!==-1 ? t : 'lessons'; }
  function newBoard(name, type){
    var t = normBoardType(type);
    return {id: uid(), name: name, type: t, subjects: [], events: [], income: [], expenses: [], balances: [], rates: {}, wheelCurrency: '', scheduleItems: []};
  }
  function activeBoard(){
    var b = state.boards.find(function(x){ return x.id===state.activeBoardId; });
    return b || state.boards[0];
  }
  function normalizeBoard(b){
    b.type = normBoardType(b.type);
    if(!Array.isArray(b.subjects)) b.subjects = [];
    if(!Array.isArray(b.events)) b.events = [];
    if(!Array.isArray(b.income)) b.income = [];
    if(!Array.isArray(b.expenses)) b.expenses = [];
    if(!Array.isArray(b.balances)) b.balances = [];
    if(!Array.isArray(b.scheduleItems)) b.scheduleItems = [];
    if(!b.rates || typeof b.rates!=='object') b.rates = {};
    if(typeof b.wheelCurrency!=='string' || CURRENCY_KEYS.indexOf(b.wheelCurrency)===-1) b.wheelCurrency = '';
    b.scheduleItems.forEach(function(x){
      if(!Array.isArray(x.times)){
        var legacyDays;
        if(Array.isArray(x.days)) legacyDays = x.days;
        else if(typeof x.day!=='undefined') legacyDays = [x.day];
        else legacyDays = [];
        legacyDays = legacyDays.map(function(d){ return parseInt(d,10); }).filter(function(d){ return DOW_VALUES.indexOf(d)!==-1; });
        var legacyStart = typeof x.timeStart==='string' ? x.timeStart : '';
        var legacyEnd = typeof x.timeEnd==='string' ? x.timeEnd : '';
        x.times = legacyDays.map(function(d){ return {id: uid(), day: d, timeStart: legacyStart, timeEnd: legacyEnd}; });
      }
      delete x.day; delete x.days; delete x.timeStart; delete x.timeEnd;
      if(!Array.isArray(x.times)) x.times = [];
      x.times.forEach(function(t){
        var dv = parseInt(t.day,10);
        t.day = (DOW_VALUES.indexOf(dv)!==-1) ? dv : DOW_VALUES[0];
        if(typeof t.timeStart!=='string') t.timeStart = '';
        if(typeof t.timeEnd!=='string') t.timeEnd = '';
        if(!t.id) t.id = uid();
      });
      if(typeof x.name!=='string') x.name = '';
      if(!x.color || COLOR_KEYS.indexOf(x.color)===-1) x.color = COLOR_KEYS[0];
      if(typeof x.notes!=='string') x.notes = '';
    });
    b.subjects.forEach(function(s){
      s.planType = (s.planType==='static') ? 'static' : 'dynamic';
      if(typeof s.total!=='number') s.total = s.total ? Number(s.total)||0 : 0;
      if(typeof s.paidUntil!=='string') s.paidUntil = '';
      if(typeof s.timeStart!=='string') s.timeStart = '';
      if(typeof s.timeEnd!=='string') s.timeEnd = '';
      if(!s.cancelled) s.cancelled = [];
      if(!s.rescheduled) s.rescheduled = {};
    });
    b.events.forEach(function(e){ e.yearly = !!e.yearly; });
    b.income.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.scheduleType = (x.scheduleType==='monthly') ? 'monthly' : 'once';
      if(typeof x.date!=='string') x.date = '';
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      var dom = parseInt(x.dayOfMonth,10);
      x.dayOfMonth = (dom>=1 && dom<=28) ? dom : 1;
      if(!Array.isArray(x.history)) x.history = [];
    });
    b.expenses.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      if(!Array.isArray(x.history)) x.history = [];
    });
    b.balances.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      if(typeof x.label!=='string') x.label = '';
    });
    return b;
  }

  function getRate(ab, from, to){
    if(from===to) return 1;
    var direct = ab.rates[from+'_'+to];
    if(typeof direct==='number' && direct>0) return direct;
    var inverse = ab.rates[to+'_'+from];
    if(typeof inverse==='number' && inverse>0) return 1/inverse;
    return null;
  }

  var ratesLoading = false;
  function refreshRatesFromApi(display){
    if(ratesLoading) return;
    if(typeof fetch!=='function'){ showToast('Автообновление курсов недоступно в этом браузере'); return; }
    ratesLoading = true;
    showToast('Обновляем курсы…');
    fetch('https://open.er-api.com/v6/latest/'+encodeURIComponent(display))
      .then(function(r){ return r.json(); })
      .then(function(data){
        ratesLoading = false;
        if(!data || data.result!=='success' || !data.rates){
          showToast('Не удалось получить курсы');
          return;
        }
        var ab = activeBoard();
        var updated = 0;
        CURRENCY_KEYS.forEach(function(c){
          if(c!==display && typeof data.rates[c]==='number' && data.rates[c]>0){
            ab.rates[c+'_'+display] = 1/data.rates[c];
            updated++;
          }
        });
        showToast(updated ? 'Курсы обновлены' : 'Курсы не изменились');
        saveData();
      })
      .catch(function(){
        ratesLoading = false;
        showToast('Не удалось получить курсы — проверьте подключение к интернету');
      });
  }

  // ---------- scheduling logic (lessons) ----------
  function nowHM(){ var n=new Date(); return pad(n.getHours())+':'+pad(n.getMinutes()); }
  function occurrencePast(ds, subj){
    var todayStr = fmt(todayD());
    if(ds < todayStr) return true;
    if(ds > todayStr) return false;
    var timeRef = subj.timeEnd || subj.timeStart;
    if(!timeRef) return true;
    return nowHM() >= timeRef;
  }
  function occurrencesInRange(subj, rangeStart, rangeEnd){
    var start = parseD(subj.startDate);
    var from = start > rangeStart ? start : rangeStart;
    var cancelled = new Set(subj.cancelled||[]);
    var reschedFrom = new Set(Object.keys(subj.rescheduled||{}));
    var set = new Set();
    if(from <= rangeEnd){
      var guard = 0;
      for(var d=new Date(from); d<=rangeEnd && guard<4000; d=addDays(d,1), guard++){
        var ds = fmt(d);
        if(subj.days.indexOf(d.getDay())!==-1 && !reschedFrom.has(ds) && !cancelled.has(ds)){
          set.add(ds);
        }
      }
    }
    Object.keys(subj.rescheduled||{}).forEach(function(fromKey){
      var to_ = subj.rescheduled[fromKey];
      var td = parseD(to_);
      if(td>=rangeStart && td<=rangeEnd && !cancelled.has(to_)) set.add(to_);
    });
    return Array.from(set).sort();
  }
  function usedCount(subj){
    var t = todayD();
    var todayStr = fmt(t);
    var occ = occurrencesInRange(subj, parseD(subj.startDate), t);
    return occ.filter(function(ds){
      if(ds!==todayStr) return true;
      return occurrencePast(ds, subj);
    }).length;
  }
  function remaining(subj){ return subj.total - usedCount(subj); }
  function forecast(subj){
    var rem = remaining(subj);
    if(rem<=0) return {done:true};
    var t = todayD();
    var future = occurrencesInRange(subj, addDays(t,1), addDays(t, 365*3));
    if(future.length < rem) return {unknown:true, upcoming:future};
    return {date: future[rem-1], upcoming: future.slice(0,8)};
  }
  function daysUntil(ds){
    return Math.round((parseD(ds) - todayD()) / 86400000);
  }
  function dayInfo(subj, ds){
    var d = parseD(ds);
    var isPattern = subj.days.indexOf(d.getDay())!==-1 && ds >= subj.startDate;
    var cancelled = (subj.cancelled||[]).indexOf(ds)!==-1;
    var reschedMap = subj.rescheduled||{};
    var isReschedFrom = Object.prototype.hasOwnProperty.call(reschedMap, ds);
    var movedToKey = null;
    Object.keys(reschedMap).forEach(function(k){ if(reschedMap[k]===ds) movedToKey = k; });
    var past = occurrencePast(ds, subj);
    if(movedToKey !== null && !cancelled){
      return {kind: past ? 'moved-done' : 'moved-upcoming', movedFrom: movedToKey};
    }
    if(isPattern && cancelled){ return {kind:'cancelled'}; }
    if(isPattern && isReschedFrom){ return {kind:'moved-away', movedTo: reschedMap[ds]}; }
    if(isPattern){ return {kind: past ? 'done' : 'upcoming'}; }
    return null;
  }

  // ---------- events logic ----------
  function eventOccursOn(ev, ds){
    if(ev.yearly){
      var d = parseD(ds), ed = parseD(ev.date);
      return d.getMonth()===ed.getMonth() && d.getDate()===ed.getDate();
    }
    return ev.date === ds;
  }
  function nextOccurrence(ev){
    var t = todayD();
    if(!ev.yearly){
      return ev.date >= fmt(t) ? ev.date : null;
    }
    var ed = parseD(ev.date);
    var candidate = new Date(t.getFullYear(), ed.getMonth(), ed.getDate());
    if(candidate < t) candidate = new Date(t.getFullYear()+1, ed.getMonth(), ed.getDate());
    return fmt(candidate);
  }

  // ---------- finance logic ----------
  function incomeOccursOn(inc, ds){
    var d = parseD(ds);
    if(inc.scheduleType==='monthly') return d.getDate()===inc.dayOfMonth;
    return inc.date === ds;
  }
  function nextIncomeDate(inc){
    var t = todayD();
    if(inc.scheduleType==='monthly'){
      var candidate = new Date(t.getFullYear(), t.getMonth(), inc.dayOfMonth);
      if(candidate < t) candidate = new Date(t.getFullYear(), t.getMonth()+1, inc.dayOfMonth);
      return fmt(candidate);
    }
    return inc.date >= fmt(t) ? inc.date : null;
  }
  function fmtMoney(n, currency){
    var num;
    try{ num = Number(n).toLocaleString('ru-RU'); }
    catch(e){ num = String(n); }
    if(!currency) return num;
    var sym = CURRENCIES[currency] || currency;
    return num + ' ' + sym;
  }
  function currenciesUsed(list){
    var seen = {};
    var out = [];
    list.forEach(function(x){ if(!seen[x.currency]){ seen[x.currency]=true; out.push(x.currency); } });
    return out;
  }

  // ---------- storage (real browser localStorage — persists on any real host, incl. GitHub Pages) ----------
  function loadData(){
    var raw = null;
    try{ raw = localStorage.getItem(STORAGE_KEY); }
    catch(e){ state.storageOk = false; }
    if(raw){
      try{
        var data = JSON.parse(raw);
        state.boards = data.boards || [];
        state.activeBoardId = data.activeBoardId;
      }catch(e){ state.boards = []; }
    }
    state.boards.forEach(normalizeBoard);
    if(!state.boards || state.boards.length===0){
      var b = newBoard('Мой календарь', 'lessons');
      state.boards = [b]; state.activeBoardId = b.id;
    }
    if(!state.boards.find(function(b){ return b.id===state.activeBoardId; })){
      state.activeBoardId = state.boards[0].id;
    }
    checkHashImport();
    render();
  }
  function saveData(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({boards: state.boards, activeBoardId: state.activeBoardId}));
    }catch(e){ state.storageOk = false; }
    render();
  }

  // ---------- sharing: the board's data is JSON, LZ-compressed into a URL-safe string ----------
  function encodeBoard(board){
    try{
      var json = JSON.stringify({n: board.name, t: board.type, s: board.subjects, e: board.events, i: board.income, x: board.expenses, y: board.balances, r: board.rates, w: board.wheelCurrency, q: board.scheduleItems});
      return LZString.compressToEncodedURIComponent(json);
    }catch(e){ return null; }
  }
  function decodeBoard(code){
    var json = LZString.decompressFromEncodedURIComponent(code);
    if(!json) throw new Error('bad payload');
    var obj = JSON.parse(json);
    if(!obj || typeof obj.n!=='string') throw new Error('bad payload');
    var b = {
      name: obj.n,
      type: normBoardType(obj.t),
      subjects: Array.isArray(obj.s)?obj.s:[],
      events: Array.isArray(obj.e)?obj.e:[],
      income: Array.isArray(obj.i)?obj.i:[],
      expenses: Array.isArray(obj.x)?obj.x:[],
      balances: Array.isArray(obj.y)?obj.y:[],
      rates: (obj.r && typeof obj.r==='object') ? obj.r : {},
      wheelCurrency: typeof obj.w==='string' ? obj.w : '',
      scheduleItems: Array.isArray(obj.q)?obj.q:[]
    };
    return b;
  }
  function checkHashImport(){
    var h = window.location.hash;
    if(h && h.indexOf('#board=')===0){
      var code = h.slice('#board='.length);
      try{
        var decoded = decodeBoard(code);
        state.pendingImport = {code: code, name: decoded.name, type: decoded.type, subjects: decoded.subjects, events: decoded.events, income: decoded.income, expenses: decoded.expenses, balances: decoded.balances, rates: decoded.rates, wheelCurrency: decoded.wheelCurrency, scheduleItems: decoded.scheduleItems};
      }catch(e){ /* ignore malformed hash */ }
    }
  }
  function clearHash(){
    try{ history.replaceState(null, '', window.location.pathname + window.location.search); }
    catch(e){ window.location.hash=''; }
  }
  function shareLinkFor(board){
    var code = encodeBoard(board);
    if(!code) return '';
    try{ return window.location.origin + window.location.pathname + '#board=' + code; }
    catch(e){ return ''; }
  }
  function generateShareQrSvg(text){
    if(!text) return null;
    try{
      var qr = qrcode(0, 'L');
      qr.addData(text);
      qr.make();
      var svg = qr.createSvgTag({cellSize:4, margin:8, scalable:true});
      return svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block;" ');
    }catch(e){
      return null; // link too large to fit in a QR code
    }
  }

  // ---------- board mutations ----------
  function createBoard(name, type){
    var b = newBoard(name && name.trim() ? name.trim() : 'Новая доска', type);
    state.boards.push(b);
    state.activeBoardId = b.id;
    state.menuOpen = false;
    state.financeView = 'income';
    state.editing = null;
    state.transactionTarget = null;
    saveData();
  }
  function switchBoard(id){
    state.activeBoardId = id;
    state.menuOpen = false;
    state.financeView = 'income';
    state.editing = null;
    state.transactionTarget = null;
    saveData();
  }
  function deleteBoard(id){
    if(state.boards.length<=1){ showToast('Нельзя удалить последнюю доску'); return; }
    state.boards = state.boards.filter(function(b){ return b.id!==id; });
    if(state.activeBoardId===id){ state.activeBoardId = state.boards[0].id; }
    saveData();
  }
  function acceptImport(){
    if(!state.pendingImport) return;
    var b = newBoard(state.pendingImport.name, state.pendingImport.type);
    b.subjects = state.pendingImport.subjects;
    b.events = state.pendingImport.events;
    b.income = state.pendingImport.income || [];
    b.expenses = state.pendingImport.expenses || [];
    b.balances = state.pendingImport.balances || [];
    b.rates = state.pendingImport.rates || {};
    b.wheelCurrency = state.pendingImport.wheelCurrency || '';
    b.scheduleItems = state.pendingImport.scheduleItems || [];
    normalizeBoard(b);
    state.boards.push(b);
    state.activeBoardId = b.id;
    state.pendingImport = null;
    clearHash();
    showToast('Доска добавлена');
    saveData();
  }
  function dismissImport(){
    state.pendingImport = null;
    clearHash();
    render();
  }

  // ---------- subject mutations (operate on the active board) ----------
  function addSubject(data){
    var b = activeBoard();
    b.subjects.push({
      id: uid(), name: data.name, color: data.color, days: data.days,
      startDate: data.startDate,
      planType: data.planType,
      total: data.total || 0,
      paidUntil: data.paidUntil || '',
      timeStart: data.timeStart || '',
      timeEnd: data.timeEnd || '',
      cancelled: [], rescheduled: {}
    });
    saveData();
  }
  function deleteSubject(id){
    var b = activeBoard();
    b.subjects = b.subjects.filter(function(s){ return s.id!==id; });
    saveData();
  }
  function updateSubject(id, data){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(!s) return;
    s.name = data.name; s.color = data.color; s.days = data.days; s.startDate = data.startDate;
    s.planType = data.planType;
    s.timeStart = data.timeStart || ''; s.timeEnd = data.timeEnd || '';
    if(data.planType==='static'){ s.paidUntil = data.paidUntil || ''; }
    else { s.total = data.total || 0; }
    saveData();
  }
  function updateTotal(id, total){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(s){ s.total = Math.max(0, total); saveData(); }
  }
  function updatePaidUntil(id, dateStr){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(s){ s.paidUntil = dateStr; saveData(); }
  }
  function cancelOccurrence(subjId, ds){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s) return;
    var info = dayInfo(s, ds);
    if(!info) return;
    if(info.kind==='moved-done' || info.kind==='moved-upcoming'){
      var origin = info.movedFrom;
      delete s.rescheduled[origin];
      s.cancelled = (s.cancelled||[]).concat([origin]);
    } else {
      s.cancelled = (s.cancelled||[]).concat([ds]);
    }
    saveData();
  }
  function restoreOccurrence(subjId, ds){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s) return;
    s.cancelled = (s.cancelled||[]).filter(function(x){ return x!==ds; });
    saveData();
  }
  function rescheduleOccurrence(subjId, fromDs, toDs){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s || !toDs) return;
    s.rescheduled = s.rescheduled || {};
    s.rescheduled[fromDs] = toDs;
    saveData();
  }

  // ---------- event mutations ----------
  function addEvent(data){
    var b = activeBoard();
    b.events.push({id: uid(), name: data.name, color: data.color, date: data.date, yearly: !!data.yearly});
    saveData();
  }
  function deleteEvent(id){
    var b = activeBoard();
    b.events = b.events.filter(function(e){ return e.id!==id; });
    saveData();
  }
  function updateEvent(id, data){
    var b = activeBoard();
    var e = b.events.find(function(x){ return x.id===id; });
    if(!e) return;
    e.name = data.name; e.color = data.color; e.date = data.date; e.yearly = !!data.yearly;
    saveData();
  }

  // ---------- finance mutations ----------
  function addIncome(data){
    var b = activeBoard();
    b.income.push({
      id: uid(), name: data.name, color: data.color, amount: data.amount, currency: data.currency,
      scheduleType: data.scheduleType, date: data.date || '', dayOfMonth: data.dayOfMonth || 1
    });
    saveData();
  }
  function updateIncome(id, data){
    var b = activeBoard();
    var x = b.income.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.amount = data.amount; x.currency = data.currency;
    x.scheduleType = data.scheduleType; x.date = data.date || ''; x.dayOfMonth = data.dayOfMonth || 1;
    saveData();
  }
  function deleteIncome(id){
    var b = activeBoard();
    b.income = b.income.filter(function(x){ return x.id!==id; });
    saveData();
  }
  function addExpense(data){
    var b = activeBoard();
    b.expenses.push({id: uid(), name: data.name, color: data.color, amount: data.amount, currency: data.currency});
    saveData();
  }
  function updateExpense(id, data){
    var b = activeBoard();
    var x = b.expenses.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.amount = data.amount; x.currency = data.currency;
    saveData();
  }
  function deleteExpense(id){
    var b = activeBoard();
    b.expenses = b.expenses.filter(function(x){ return x.id!==id; });
    saveData();
  }

  // ---------- schedule mutations ----------
  function addScheduleItem(data){
    var b = activeBoard();
    b.scheduleItems.push({id: uid(), name: data.name, color: data.color, notes: data.notes || '', times: []});
    saveData();
  }
  function updateScheduleItem(id, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.notes = data.notes || '';
    saveData();
  }
  function deleteScheduleItem(id){
    var b = activeBoard();
    b.scheduleItems = b.scheduleItems.filter(function(x){ return x.id!==id; });
    saveData();
  }
  function addScheduleTime(itemId, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    x.times.push({id: uid(), day: data.day, timeStart: data.timeStart || '', timeEnd: data.timeEnd || ''});
    saveData();
  }
  function updateScheduleTime(itemId, timeId, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    var t = x.times.find(function(v){ return v.id===timeId; });
    if(!t) return;
    t.day = data.day; t.timeStart = data.timeStart || ''; t.timeEnd = data.timeEnd || '';
    saveData();
  }
  function deleteScheduleTime(itemId, timeId){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    x.times = x.times.filter(function(v){ return v.id!==timeId; });
    saveData();
  }

  // ---------- balance mutations ----------
  function addBalance(data){
    var b = activeBoard();
    b.balances.push({id: uid(), label: data.label || '', currency: data.currency, amount: data.amount});
    saveData();
  }
  function updateBalance(id, data){
    var b = activeBoard();
    var x = b.balances.find(function(v){ return v.id===id; });
    if(!x) return;
    x.label = data.label || ''; x.currency = data.currency; x.amount = data.amount;
    saveData();
  }
  function deleteBalance(id){
    var b = activeBoard();
    b.balances = b.balances.filter(function(x){ return x.id!==id; });
    saveData();
  }

  // ---------- transactions: add an amount to an income/expense card and move a chosen balance account ----------
  function addTransaction(kind, id, amount, balanceId, date){
    var b = activeBoard();
    var list = kind==='income' ? b.income : b.expenses;
    var item = list.find(function(x){ return x.id===id; });
    if(!item) return null;
    item.amount = Math.max(0, item.amount + amount);
    var bal = balanceId ? b.balances.find(function(x){ return x.id===balanceId; }) : null;
    var found = !!bal;
    if(bal){
      bal.amount += (kind==='income' ? amount : -amount);
    }
    if(!Array.isArray(item.history)) item.history = [];
    item.history.push({id: uid(), date: date || fmt(todayD()), amount: amount, balanceId: found ? balanceId : null});
    saveData();
    return found;
  }
  function deleteTransaction(kind, itemId, historyId){
    var b = activeBoard();
    var list = kind==='income' ? b.income : b.expenses;
    var item = list.find(function(x){ return x.id===itemId; });
    if(!item || !Array.isArray(item.history)) return;
    var idx = item.history.findIndex(function(h){ return h.id===historyId; });
    if(idx===-1) return;
    var h = item.history[idx];
    item.amount = Math.max(0, item.amount - h.amount);
    if(h.balanceId){
      var bal = b.balances.find(function(x){ return x.id===h.balanceId; });
      if(bal){ bal.amount -= (kind==='income' ? h.amount : -h.amount); }
    }
    item.history.splice(idx, 1);
    saveData();
  }

  // ---------- render ----------
  var app = document.getElementById('app');

  function render(){
    var html = '';
    html += renderHeader();
    if(state.pendingImport) html += renderImportBanner();
    html += '<div class="layout">';
    html += renderSidebar();
    html += renderCalendar();
    html += '</div>';
    if(state.modal==='add') html += renderAddModal();
    if(state.modal==='day') html += renderDayModal();
    if(state.modal==='balance') html += renderBalanceModal();
    if(state.modal==='transaction') html += renderTransactionModal();
    if(state.modal==='rates') html += renderRatesModal();
    if(state.modal==='history') html += renderTransactionHistoryModal();
    if(state.modal==='settings') html += renderSettingsModal();
    if(state.modal==='schedule-time') html += renderScheduleTimeModal();
    if(state.menuOpen) html += renderMenuDrawer();
    app.innerHTML = html;
    attachHandlers();
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function renderAddModal(){
    var ab = activeBoard();
    if(ab.type==='events') return renderAddEventModal();
    if(ab.type==='finance') return state.financeView==='expenses' ? renderAddExpenseModal() : renderAddIncomeModal();
    if(ab.type==='schedule') return renderAddScheduleItemModal();
    return renderAddSubjectModal();
  }
  function renderDayModal(){
    var ab = activeBoard();
    if(ab.type==='events') return renderEventDayModal();
    if(ab.type==='finance') return renderFinanceDayModal();
    if(ab.type==='schedule') return renderScheduleDayModal();
    return renderLessonDayModal();
  }

  function renderImportBanner(){
    return ''+
    '<div class="import-banner">'+
      '<div class="txt">Ссылка содержит доску «<b>'+escapeHtml(state.pendingImport.name)+'</b>» ('+BOARD_TYPE_LABELS[normBoardType(state.pendingImport.type)]+'). Добавить её к своим?</div>'+
      '<div class="import-actions">'+
        '<button class="btn primary small" data-act="accept-import">Добавить</button>'+
        '<button class="btn small" data-act="dismiss-import">Скрыть</button>'+
      '</div>'+
    '</div>';
  }

  function renderHeader(){
    var vd = state.viewDate;
    var ab = activeBoard();
    var typeLabel = ab.type==='events' ? 'события' : (ab.type==='finance' ? 'финансы' : (ab.type==='schedule' ? 'расписание' : 'занятия'));
    var storageWarn = state.storageOk ? '' :
      '<div class="storage-warn">Локальное хранилище браузера недоступно (например, приватный режим) — изменения не сохранятся.</div>';
    var financeToggle = '';
    if(ab.type==='finance'){
      financeToggle = ''+
        '<button class="btn small'+(state.financeView==='income'?' primary':'')+'" data-act="finance-view" data-view="income">Доходы</button>'+
        '<button class="btn small'+(state.financeView==='expenses'?' primary':'')+'" data-act="finance-view" data-view="expenses">Расходы</button>';
    }
    return ''+
      '<header class="top">'+
        '<div class="top-left">'+
          '<button class="icon-btn" data-act="open-menu" title="Доски">☰</button>'+
          '<div><h1 class="display">Календарь<span>Доска: <b>'+escapeHtml(ab.name)+'</b> · '+typeLabel+'</span></h1></div>'+
        '</div>'+
        '<div class="month-nav">'+
          '<button class="icon-btn" data-act="prev-month">‹</button>'+
          '<div class="label mono">'+MONTH_NAMES[vd.getMonth()]+' '+vd.getFullYear()+'</div>'+
          '<button class="icon-btn" data-act="next-month">›</button>'+
          financeToggle+
          '<button class="btn small" data-act="today">Сегодня</button>'+
        '</div>'+
      '</header>'+
      storageWarn;
  }

  function renderSidebar(){
    var ab = activeBoard();
    if(ab.type==='events') return renderEventsSidebar(ab);
    if(ab.type==='finance') return state.financeView==='expenses' ? renderExpensesSidebar(ab) : renderIncomeSidebar(ab);
    if(ab.type==='schedule') return renderScheduleSidebar(ab);
    return renderLessonsSidebar(ab);
  }

  function renderLessonsSidebar(ab){
    var html = '<div class="sidebar"><h2>Курсы</h2><div class="cards">';
    if(ab.subjects.length===0){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте первый курс, чтобы начать отсчёт уроков.</div>';
    }
    ab.subjects.forEach(function(s){
      var color = COLORS[s.color] || COLORS.amber;
      var daysStr = s.days.slice().sort(function(a,b){ return DOW_VALUES.indexOf(a)-DOW_VALUES.indexOf(b); })
        .map(function(v){ return DOW_LABELS[DOW_VALUES.indexOf(v)]; }).join(', ');
      var timeStr = timeRangeStr(s);
      var metaLine = daysStr + ' · с '+fmtHuman(s.startDate) + (timeStr ? ' · '+timeStr : '');

      var bodyHtml;
      if(s.planType==='static'){
        var statLine;
        if(!s.paidUntil){
          statLine = '<span class="dim">Дата окончания не указана</span>';
        } else {
          var dl = daysUntil(s.paidUntil);
          if(dl<0) statLine = '<span class="warn">Абонемент истёк '+fmtHuman(s.paidUntil)+'</span>';
          else if(dl<=7) statLine = '<span class="warn">Осталось '+dl+' дн. (до '+fmtHuman(s.paidUntil)+')</span>';
          else statLine = 'Оплачено до <b>'+fmtHuman(s.paidUntil)+'</b>';
        }
        bodyHtml = ''+
          '<div class="pc-stats">'+
            'Абонемент до <span class="pc-total-edit"><input type="date" class="mono" data-act="edit-paiduntil" data-id="'+s.id+'" value="'+(s.paidUntil||'')+'"></span>'+
            '<br>'+statLine+
          '</div>';
      } else {
        var used = usedCount(s);
        var rem = remaining(s);
        var fc = forecast(s);
        var maxDots = 60;
        var dotsHtml = '';
        var dotCount = Math.min(s.total, maxDots);
        for(var i=0;i<dotCount;i++){
          dotsHtml += '<i class="'+(i<used?'filled':'')+'" style="--dotcolor:'+color+'"></i>';
        }
        var overflowNote = s.total>maxDots ? ' <span class="mono" style="font-size:10px;">+'+(s.total-maxDots)+'</span>' : '';
        var statLine2;
        if(rem<0){
          statLine2 = '<span class="warn">Превышение на '+Math.abs(rem)+' — увеличьте количество уроков</span>';
        } else if(rem===0){
          statLine2 = '<span class="warn">Уроки закончились</span>';
        } else if(fc.date){
          statLine2 = 'Хватит до <b>'+fmtHuman(fc.date)+'</b>';
        } else if(fc.unknown){
          statLine2 = '<span class="dim">хватит более чем на 3 года вперёд</span>';
        } else {
          statLine2 = '';
        }
        bodyHtml = ''+
          '<div class="dots">'+dotsHtml+overflowNote+'</div>'+
          '<div class="pc-stats">'+
            'Осталось <b>'+rem+'</b> из '+
            '<span class="pc-total-edit"><input type="number" min="0" class="mono" data-act="edit-total" data-id="'+s.id+'" value="'+s.total+'"></span>'+
            '<br>'+statLine2+
          '</div>';
      }

      html += ''+
        '<div class="punch-card" data-subj="'+s.id+'">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt">'+escapeHtml(s.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="edit-subject" data-id="'+s.id+'" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-subject" data-id="'+s.id+'" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-days mono">'+metaLine+'</div>'+
          '<div class="pc-body">'+bodyHtml+'</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ Добавить курс</button>';
    html += '</div>';
    return html;
  }

  function renderEventsSidebar(ab){
    var html = '<div class="sidebar"><h2>События</h2><div class="cards">';
    if(ab.events.length===0){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте первое событие — например, день рождения.</div>';
    }
    var sorted = ab.events.slice().sort(function(a,b){
      var na = nextOccurrence(a), nb = nextOccurrence(b);
      if(!na && !nb) return 0;
      if(!na) return 1;
      if(!nb) return -1;
      return na < nb ? -1 : 1;
    });
    sorted.forEach(function(ev){
      var color = COLORS[ev.color] || COLORS.amber;
      var next = nextOccurrence(ev);
      var line1 = ev.yearly ? ('Ежегодно · '+fmtHumanNoYear(ev.date)) : fmtHuman(ev.date);
      var line2;
      if(next){
        var dl = daysUntil(next);
        if(dl===0) line2 = '<b style="color:var(--amber)">Сегодня!</b>';
        else line2 = 'через '+dl+' дн.';
      } else {
        line2 = '<span class="dim">прошло</span>';
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt">'+escapeHtml(ev.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="edit-event" data-id="'+ev.id+'" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-event" data-id="'+ev.id+'" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats">'+line1+'<br>'+line2+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ Добавить событие</button>';
    html += '</div>';
    return html;
  }

  function renderScheduleSidebar(ab){
    var html = '<div class="sidebar"><h2>Расписание</h2><div class="cards">';
    if(ab.scheduleItems.length===0){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Сначала добавьте урок, а потом расставьте дни и время для него.</div>';
    }
    var sorted = ab.scheduleItems.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
    sorted.forEach(function(it){
      var color = COLORS[it.color] || COLORS.amber;
      var timesSorted = it.times.slice().sort(function(a,b){
        var da = DOW_VALUES.indexOf(a.day), db = DOW_VALUES.indexOf(b.day);
        if(da!==db) return da-db;
        return (a.timeStart||'').localeCompare(b.timeStart||'');
      });
      var timesHtml;
      if(timesSorted.length===0){
        timesHtml = '<div class="dim" style="font-size:12px;">Дни и время ещё не заданы</div>';
      } else {
        timesHtml = timesSorted.map(function(t){
          var lbl = DOW_LABELS[DOW_VALUES.indexOf(t.day)] + (timeRangeStr(t) ? ' · '+timeRangeStr(t) : '');
          return ''+
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 0;">'+
              '<span class="mono" style="font-size:12px;">'+lbl+'</span>'+
              '<span style="display:flex;gap:4px;">'+
                '<button class="icon-btn tiny" data-act="edit-schedule-time" data-item="'+it.id+'" data-time="'+t.id+'" title="Изменить">✎</button>'+
                '<button class="icon-btn tiny" data-act="delete-schedule-time" data-item="'+it.id+'" data-time="'+t.id+'" title="Удалить">✕</button>'+
              '</span>'+
            '</div>';
        }).join('');
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt">'+escapeHtml(it.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-schedule-time" data-item="'+it.id+'" title="Добавить день и время" style="width:26px;height:26px;font-size:14px;">+</button>'+
              '<button class="icon-btn" data-act="edit-schedule-item" data-id="'+it.id+'" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-schedule-item" data-id="'+it.id+'" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            (it.notes?'<div class="pc-stats" style="margin-bottom:6px;"><span class="dim">'+escapeHtml(it.notes)+'</span></div>':'')+
            timesHtml+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ Добавить урок</button>';
    html += '</div>';
    return html;
  }

  function renderBalanceWidget(ab){
    var totals = {};
    var order = [];
    ab.balances.forEach(function(x){
      if(!totals[x.currency]){ totals[x.currency]=0; order.push(x.currency); }
      totals[x.currency] += x.amount;
    });
    var summary = order.length ? order.map(function(c){ return fmtMoney(totals[c], c); }).join(' · ') : 'Добавить баланс';
    return ''+
      '<button class="balance-widget" data-act="open-balance">'+
        '<div class="balance-widget-label">Баланс</div>'+
        '<div class="balance-widget-value mono">'+escapeHtml(summary)+'</div>'+
      '</button>';
  }

  function renderIncomeSidebar(ab){
    var html = '<div class="sidebar">'+renderBalanceWidget(ab)+'<h2>Доходы</h2><div class="cards">';
    if(ab.income.length===0){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте зарплату, инвестиции или другой источник дохода.</div>';
    }
    var sorted = ab.income.slice().sort(function(a,b){
      var na = nextIncomeDate(a), nb = nextIncomeDate(b);
      if(!na && !nb) return 0;
      if(!na) return 1;
      if(!nb) return -1;
      return na < nb ? -1 : 1;
    });
    sorted.forEach(function(inc){
      var color = COLORS[inc.color] || COLORS.amber;
      var line1 = inc.scheduleType==='monthly' ? ('Ежемесячно · '+inc.dayOfMonth+' числа') : ('Разово · '+fmtHuman(inc.date));
      var next = nextIncomeDate(inc);
      var line2;
      if(next){
        var dl = daysUntil(next);
        if(dl===0) line2 = '<b style="color:var(--amber)">Сегодня!</b>';
        else line2 = 'через '+dl+' дн.';
      } else {
        line2 = '<span class="dim">прошло</span>';
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt">'+escapeHtml(inc.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-transaction" data-kind="income" data-id="'+inc.id+'" title="Добавить сумму" style="width:26px;height:26px;font-size:14px;">+</button>'+
              '<button class="icon-btn" data-act="edit-income" data-id="'+inc.id+'" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-income" data-id="'+inc.id+'" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats"><b>'+fmtMoney(inc.amount, inc.currency)+'</b><br>'+line1+'<br>'+line2+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ Добавить доход</button>';
    html += '</div>';
    return html;
  }

  function renderExpensesSidebar(ab){
    var html = '<div class="sidebar">'+renderBalanceWidget(ab)+'<h2>Расходы</h2><div class="cards">';
    if(ab.expenses.length===0){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте статьи расходов, чтобы увидеть их на колесе.</div>';
    }
    var totalsByCur = {};
    ab.expenses.forEach(function(e){ totalsByCur[e.currency] = (totalsByCur[e.currency]||0) + e.amount; });
    ab.expenses.forEach(function(exp){
      var color = COLORS[exp.color] || COLORS.amber;
      var curTotal = totalsByCur[exp.currency] || 0;
      var pct = curTotal>0 ? Math.round(exp.amount/curTotal*100) : 0;
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt">'+escapeHtml(exp.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-transaction" data-kind="expense" data-id="'+exp.id+'" title="Добавить сумму" style="width:26px;height:26px;font-size:14px;">+</button>'+
              '<button class="icon-btn" data-act="edit-expense" data-id="'+exp.id+'" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-expense" data-id="'+exp.id+'" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats"><b>'+fmtMoney(exp.amount, exp.currency)+'</b><br>'+pct+'% от расходов в '+(CURRENCIES[exp.currency]||exp.currency)+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ Добавить расход</button>';
    html += '</div>';
    return html;
  }

  function renderCalendar(){
    var ab = activeBoard();
    var compact = (ab.type==='finance' && state.financeView==='expenses') || (ab.type==='schedule');
    var html = '<div class="cal-col">';
    html += renderCalendarGrid(compact);
    if(ab.type==='finance' && state.financeView==='expenses') html += renderExpenseWheel(ab);
    if(ab.type==='schedule') html += renderScheduleTable(ab);
    html += '</div>';
    return html;
  }

  function renderCalendarGrid(compact){
    var vd = state.viewDate;
    var ab = activeBoard();
    var y = vd.getFullYear(), m = vd.getMonth();
    var firstOfMonth = new Date(y,m,1);
    var jsDow = firstOfMonth.getDay();
    var mondayOffset = (jsDow===0) ? 6 : jsDow-1;
    var gridStart = addDays(firstOfMonth, -mondayOffset);
    var todayStr = fmt(todayD());

    var dowRow = '<div class="cal-dow">'+DOW_LABELS.map(function(l){ return '<div>'+l+'</div>'; }).join('')+'</div>';
    var cells = '';
    for(var i=0;i<42;i++){
      var d = addDays(gridStart, i);
      var ds = fmt(d);
      var outside = d.getMonth()!==m;
      var isToday = ds===todayStr;
      var markers = '';
      if(ab.type==='events'){
        ab.events.forEach(function(ev){
          if(!eventOccursOn(ev, ds)) return;
          var color = COLORS[ev.color] || COLORS.amber;
          var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
          markers += '<span class="'+cls+'" title="'+escapeHtml(ev.name)+'" style="--mc:'+color+'"></span>';
        });
      } else if(ab.type==='finance'){
        ab.income.forEach(function(inc){
          var scheduled = incomeOccursOn(inc, ds);
          var histEntry = (inc.history||[]).find(function(h){ return h.date===ds; });
          if(!scheduled && !histEntry) return;
          var color = COLORS[inc.color] || COLORS.amber;
          var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
          var tt = histEntry ? (inc.name+' · +'+fmtMoney(histEntry.amount, inc.currency)) : (inc.name+' · '+fmtMoney(inc.amount, inc.currency));
          markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
        });
        ab.expenses.forEach(function(exp){
          var histEntry = (exp.history||[]).find(function(h){ return h.date===ds; });
          if(!histEntry) return;
          var color = COLORS[exp.color] || COLORS.amber;
          var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
          var tt = exp.name+' · -'+fmtMoney(histEntry.amount, exp.currency);
          markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
        });
      } else if(ab.type==='schedule'){
        ab.scheduleItems.forEach(function(it){
          it.times.forEach(function(t){
            if(t.day!==d.getDay()) return;
            var color = COLORS[it.color] || COLORS.amber;
            var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
            var tt = it.name + (timeRangeStr(t) ? ' · '+timeRangeStr(t) : '');
            markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
          });
        });
      } else {
        ab.subjects.forEach(function(s){
          var info = dayInfo(s, ds);
          if(!info) return;
          var color = COLORS[s.color] || COLORS.amber;
          var cls = 'marker';
          if(info.kind==='cancelled'){ cls += ' cancelled'; }
          else if(info.kind==='upcoming'){ cls += ' outline'; }
          else if(info.kind==='moved-upcoming'){ cls += ' outline moved'; }
          else if(info.kind==='moved-done'){ cls += ' moved'; }
          var tt = s.name + (timeRangeStr(s) ? ' · '+timeRangeStr(s) : '');
          markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
        });
      }
      cells += ''+
        '<div class="cal-cell'+(outside?' outside':'')+(isToday?' today':'')+'" data-act="open-day" data-date="'+ds+'">'+
          '<div class="num">'+d.getDate()+'</div>'+
          '<div class="cal-markers">'+markers+'</div>'+
        '</div>';
    }
    return '<div class="cal-wrap'+(compact?' compact':'')+'">'+dowRow+'<div class="cal-grid">'+cells+'</div></div>';
  }

  function renderExpenseWheel(ab){
    var curs = currenciesUsed(ab.expenses);
    var display = (ab.wheelCurrency && CURRENCY_KEYS.indexOf(ab.wheelCurrency)!==-1) ? ab.wheelCurrency : (curs[0] || DEFAULT_CURRENCY);
    var controlsHtml = ''+
      '<div class="wheel-controls">'+
        '<label class="mono">Колесо в:</label>'+
        '<select data-act="set-wheel-currency">'+
          CURRENCY_KEYS.map(function(c){ return '<option value="'+c+'"'+(c===display?' selected':'')+'>'+c+' ('+CURRENCIES[c]+')</option>'; }).join('')+
        '</select>'+
        '<button type="button" class="btn small" data-act="refresh-rates" data-to="'+display+'">Обновить курсы</button>'+
        '<button type="button" class="btn small" data-act="open-rates">Курсы валют</button>'+
        '<button type="button" class="btn small" data-act="open-history">История транзакций</button>'+
      '</div>';
    if(ab.expenses.length===0){
      return controlsHtml + '<div class="empty" style="padding:24px 10px;"><div class="display">Колесо пусто</div>Добавьте расходы слева, чтобы увидеть распределение.</div>';
    }

    var missing = [];
    var items = ab.expenses.map(function(exp){
      var rate = getRate(ab, exp.currency, display);
      var known = rate!==null;
      if(!known){ rate = 1; if(missing.indexOf(exp.currency)===-1 && exp.currency!==display) missing.push(exp.currency); }
      return {exp: exp, val: exp.amount*rate, known: known};
    });
    var total = items.reduce(function(s,it){ return s+it.val; }, 0);

    var selectorHtml = controlsHtml;

    var rateHtml = '';
    if(missing.length){
      rateHtml = '<div class="wheel-rate-warning">Не удалось найти курс автоматически — введите вручную:'+
        missing.map(function(c){
          return '<div class="rate-row"><span class="mono">1 '+c+' ('+CURRENCIES[c]+') = </span>'+
            '<input type="number" step="0.0001" min="0" placeholder="курс" data-act="set-rate" data-from="'+c+'" data-to="'+display+'">'+
            '<span class="mono">'+display+'</span></div>';
        }).join('')+
      '</div>';
    }

    if(total<=0){
      var flatLegend = ab.expenses.map(function(exp){
        var color = COLORS[exp.color] || COLORS.amber;
        return '<div class="wheel-legend-item"><span class="dot" style="background:'+color+'"></span><span>'+escapeHtml(exp.name)+'</span><span class="pct">'+fmtMoney(exp.amount, exp.currency)+'</span></div>';
      }).join('');
      return selectorHtml + rateHtml + ''+
      '<div class="finance-wheel-wrap">'+
        '<div class="wheel-outer" style="background:var(--surface-2);">'+
          '<div class="wheel-hole"><div class="wheel-total mono" style="font-size:12px;">0</div><div class="mono" style="font-size:10px;color:var(--ink-faint);">пока нечего делить</div></div>'+
        '</div>'+
        '<div class="wheel-legend">'+flatLegend+'</div>'+
      '</div>';
    }

    var cum = 0;
    var stops = [];
    var legend = '';
    items.forEach(function(it){
      var exp = it.exp;
      var color = COLORS[exp.color] || COLORS.amber;
      var pct = it.val/total*100;
      var start = cum;
      cum += pct;
      stops.push(color+' '+start.toFixed(2)+'% '+cum.toFixed(2)+'%');
      var shown = fmtMoney(exp.amount, exp.currency);
      var extra = '';
      if(exp.currency!==display){
        extra = it.known ? (' ≈ '+fmtMoney(it.val, display)) : ' <span style="color:var(--rose)">— нужен курс</span>';
      }
      legend += ''+
        '<div class="wheel-legend-item">'+
          '<span class="dot" style="background:'+color+'"></span>'+
          '<span>'+escapeHtml(exp.name)+'</span>'+
          '<span class="pct">'+shown+extra+' · '+Math.round(pct)+'%</span>'+
        '</div>';
    });
    var gradient = 'conic-gradient('+stops.join(', ')+')';
    return selectorHtml + rateHtml + ''+
    '<div class="finance-wheel-wrap">'+
      '<div class="wheel-outer" style="background:'+gradient+'">'+
        '<div class="wheel-hole"><div class="wheel-total">'+fmtMoney(total, display)+'</div><div class="mono" style="font-size:10px;color:var(--ink-faint);">всего</div></div>'+
      '</div>'+
      '<div class="wheel-legend">'+legend+'</div>'+
    '</div>';
  }

  function renderScheduleTable(ab){
    var dayPicker = '<div class="day-toggles" style="margin-bottom:14px;">'+
      DOW_VALUES.map(function(v,idx){
        return '<button type="button" class="day-toggle'+(state.scheduleDay===v?' active':'')+'" data-act="pick-schedule-day" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
      }).join('')+
    '</div>';
    var rows = [];
    ab.scheduleItems.forEach(function(it){
      it.times.forEach(function(t){
        if(t.day===state.scheduleDay) rows.push({item: it, t: t});
      });
    });
    rows.sort(function(a,b){ return (a.t.timeStart||'').localeCompare(b.t.timeStart||''); });
    var dayLabel = DOW_LABELS[DOW_VALUES.indexOf(state.scheduleDay)];
    var bodyHtml;
    if(rows.length===0){
      bodyHtml = '<div class="empty" style="padding:24px 10px;"><div class="display">Пусто</div>На этот день пока ничего не добавлено.</div>';
    } else {
      bodyHtml = '<table class="schedule-table"><thead><tr><th>Начало</th><th>Конец</th><th>Описание</th></tr></thead><tbody>'+
        rows.map(function(r){
          var it = r.item, t = r.t;
          var color = COLORS[it.color] || COLORS.amber;
          return '<tr>'+
            '<td class="mono">'+(t.timeStart||'—')+'</td>'+
            '<td class="mono">'+(t.timeEnd||'—')+'</td>'+
            '<td><span class="dot" style="background:'+color+';display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;"></span>'+escapeHtml(it.name)+(it.notes?'<br><span class="dim" style="font-size:11.5px;">'+escapeHtml(it.notes)+'</span>':'')+'</td>'+
          '</tr>';
        }).join('')+
      '</tbody></table>';
    }
    return ''+
    '<div class="finance-wheel-wrap" style="display:block;">'+
      '<div class="sub" style="margin-bottom:10px;">Выберите день, чтобы увидеть расписание на него</div>'+
      dayPicker+
      '<div class="mono" style="font-size:12px;color:var(--ink-dim);margin-bottom:8px;">'+dayLabel+'</div>'+
      bodyHtml+
    '</div>';
  }

  function renderAddSubjectModal(){
    var editing = (state.editing && state.editing.kind==='subject') ? activeBoard().subjects.find(function(x){ return x.id===state.editing.id; }) : null;
    var isStatic = editing && editing.planType==='static';
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?'Изменить курс':'Новый курс')+'</h3>'+
        '<div class="sub">Добавьте занятие и укажите, по каким дням оно проходит</div>'+
        '<form id="add-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, английский" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field"><label>Цвет</label><div class="color-picker">'+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field"><label>Дни недели</label><div class="day-toggles">'+
            DOW_VALUES.map(function(v,idx){
              var active = editing && editing.days.indexOf(v)!==-1;
              return '<button type="button" class="day-toggle'+(active?' active':'')+'" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
            }).join('')+
          '</div></div>'+
          '<div class="field"><label>Время (необязательно)</label><div class="field-row">'+
            '<input type="time" name="timeStart" value="'+(editing?editing.timeStart:'')+'">'+
            '<input type="time" name="timeEnd" value="'+(editing?editing.timeEnd:'')+'">'+
          '</div></div>'+
          '<div class="field"><label>Дата начала</label><input type="date" name="startDate" value="'+(editing?editing.startDate:fmt(todayD()))+'" required></div>'+
          '<div class="field">'+
            '<label>Тип оплаты</label>'+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(!isStatic?' active':'')+'" data-plan="dynamic">По урокам</button>'+
              '<button type="button" class="toggle-btn'+(isStatic?' active':'')+'" data-plan="static">По абонементу</button>'+
            '</div>'+
            '<input type="hidden" name="planType" value="'+(isStatic?'static':'dynamic')+'">'+
          '</div>'+
          '<div class="field" data-plan-field="dynamic" style="'+(isStatic?'display:none;':'')+'"><label>Количество уроков</label><input type="number" name="total" min="1" value="'+(editing&&!isStatic?editing.total:8)+'"></div>'+
          '<div class="field" data-plan-field="static" style="'+(isStatic?'':'display:none;')+'"><label>Оплачено до</label><input type="date" name="paidUntil" value="'+(editing&&isStatic?(editing.paidUntil||''):'')+'"><div class="field-hint">Вместо счётчика уроков будет показываться, до какого числа оплачен курс.</div></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Создать курс')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderAddEventModal(){
    var editing = (state.editing && state.editing.kind==='event') ? activeBoard().events.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?'Изменить событие':'Новое событие')+'</h3>'+
        '<div class="sub">Например, день рождения или разовое напоминание</div>'+
        '<form id="add-event-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, день рождения Иры" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field"><label>Цвет</label><div class="color-picker">'+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field"><label>Дата</label><input type="date" name="date" value="'+(editing?editing.date:fmt(todayD()))+'" required></div>'+
          '<div class="field">'+
            '<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">'+
              '<input type="checkbox" name="yearly" style="width:16px;height:16px;"'+(editing&&editing.yearly?' checked':'')+'> Повторять каждый год'+
            '</label>'+
          '</div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Добавить событие')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderLessonDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var items = '';
    var any = false;
    ab.subjects.forEach(function(s){
      var info = dayInfo(s, ds);
      if(!info) return;
      any = true;
      var color = COLORS[s.color] || COLORS.amber;
      var timeTag = timeRangeStr(s) ? '<span class="mono" style="font-size:11px; color:var(--ink-dim);">'+timeRangeStr(s)+'</span>' : '';
      var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(s.name)+'</span>'+timeTag+'</div>';
      var body = '';
      if(info.kind==='cancelled'){
        body = '<div class="status warn">Занятие отменено</div>'+
          '<div class="row-actions"><button class="btn small" data-act="restore" data-subj="'+s.id+'" data-date="'+ds+'">Восстановить</button></div>';
      } else if(info.kind==='moved-away'){
        body = '<div class="status">Перенесено на '+fmtHuman(info.movedTo)+'</div>';
      } else if(info.kind==='moved-done' || info.kind==='moved-upcoming'){
        body = '<div class="status ok">Перенесено сюда с '+fmtHuman(info.movedFrom)+'</div>'+
          '<div class="row-actions"><button class="btn small danger" data-act="cancel" data-subj="'+s.id+'" data-date="'+ds+'">Отменить</button></div>';
      } else {
        var label = info.kind==='done' ? 'Прошло / засчитано' : 'Запланировано';
        var cls = info.kind==='done' ? 'ok' : '';
        body = '<div class="status '+cls+'">'+label+'</div>'+
          '<div class="row-actions">'+
            '<button class="btn small danger" data-act="cancel" data-subj="'+s.id+'" data-date="'+ds+'">Отменить</button>'+
            '<button class="btn small" data-act="show-resched" data-subj="'+s.id+'" data-date="'+ds+'">Перенести</button>'+
          '</div>'+
          '<div class="resched-box" data-subj-box="'+s.id+'" data-date-box="'+ds+'" style="display:none;">'+
            '<div class="resched-form">'+
              '<input type="date" class="mono" value="'+ds+'">'+
              '<button class="btn small primary" data-act="confirm-resched" data-subj="'+s.id+'" data-date="'+ds+'">ОК</button>'+
            '</div>'+
          '</div>';
      }
      items += '<div class="day-item">'+head+body+'</div>';
    });
    if(!any){
      items = '<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        '<div class="sub">Занятия и действия на этот день</div>'+
        items+
      '</div>'+
    '</div>';
  }

  function renderEventDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var items = '';
    var any = false;
    ab.events.forEach(function(ev){
      if(!eventOccursOn(ev, ds)) return;
      any = true;
      var color = COLORS[ev.color] || COLORS.amber;
      var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(ev.name)+'</span></div>';
      var body = (ev.yearly ? '<div class="status ok">Повторяется каждый год</div>' : '<div class="status">Разовое событие</div>')+
        '<div class="row-actions"><button class="btn small danger" data-act="delete-event" data-id="'+ev.id+'">Удалить</button></div>';
      items += '<div class="day-item">'+head+body+'</div>';
    });
    if(!any){
      items = '<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        '<div class="sub">События на этот день</div>'+
        items+
      '</div>'+
    '</div>';
  }

  function currencyOptionsHtml(selected){
    return CURRENCY_KEYS.map(function(c){
      return '<option value="'+c+'"'+(c===selected?' selected':'')+'>'+c+' ('+CURRENCIES[c]+')</option>';
    }).join('');
  }

  function renderAddIncomeModal(){
    var editing = (state.editing && state.editing.kind==='income') ? activeBoard().income.find(function(x){ return x.id===state.editing.id; }) : null;
    var isMonthly = editing && editing.scheduleType==='monthly';
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?'Изменить доход':'Новый доход')+'</h3>'+
        '<div class="sub">Зарплата, инвестиции или другой источник дохода</div>'+
        '<form id="add-income-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, зарплата" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field-row">'+
            '<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="'+(editing?editing.amount:'')+'" required></div>'+
            '<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">'+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          '<div class="field"><label>Цвет</label><div class="color-picker">'+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field">'+
            '<label>Периодичность</label>'+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(!isMonthly?' active':'')+'" data-schedule="once">Разово</button>'+
              '<button type="button" class="toggle-btn'+(isMonthly?' active':'')+'" data-schedule="monthly">Ежемесячно</button>'+
            '</div>'+
            '<input type="hidden" name="scheduleType" value="'+(isMonthly?'monthly':'once')+'">'+
          '</div>'+
          '<div class="field" data-schedule-field="once" style="'+(isMonthly?'display:none;':'')+'"><label>Дата</label><input type="date" name="date" value="'+(editing&&editing.date?editing.date:fmt(todayD()))+'"></div>'+
          '<div class="field" data-schedule-field="monthly" style="'+(isMonthly?'':'display:none;')+'"><label>Число месяца</label><input type="number" name="dayOfMonth" min="1" max="28" value="'+(editing?editing.dayOfMonth:1)+'"></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Добавить доход')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderAddExpenseModal(){
    var editing = (state.editing && state.editing.kind==='expense') ? activeBoard().expenses.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?'Изменить расход':'Новый расход')+'</h3>'+
        '<div class="sub">Появится как доля на колесе расходов</div>'+
        '<form id="add-expense-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, аренда" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field-row">'+
            '<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="'+(editing?editing.amount:'')+'" required></div>'+
            '<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">'+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          '<div class="field"><label>Цвет</label><div class="color-picker">'+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Добавить расход')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderAddScheduleItemModal(){
    var editing = (state.editing && state.editing.kind==='schedule') ? activeBoard().scheduleItems.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?'Изменить урок':'Новый урок')+'</h3>'+
        '<div class="sub">Сначала добавьте сам урок — дни и время для него можно будет расставить после, кнопкой «+» на карточке</div>'+
        '<form id="add-schedule-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, математика" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field"><label>Цвет</label><div class="color-picker">'+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field"><label>Описание (необязательно)</label><textarea name="notes" placeholder="Кабинет, преподаватель, детали...">'+(editing?escapeHtml(editing.notes||''):'')+'</textarea></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Добавить')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderScheduleTimeModal(){
    var ab = activeBoard();
    var editingTime = null, item = null;
    if(state.editing && state.editing.kind==='scheduletime'){
      item = ab.scheduleItems.find(function(x){ return x.id===state.editing.itemId; });
      editingTime = item ? item.times.find(function(t){ return t.id===state.editing.timeId; }) : null;
    } else if(state.scheduleTimeTarget){
      item = ab.scheduleItems.find(function(x){ return x.id===state.scheduleTimeTarget; });
    }
    if(!item) return '';
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editingTime?'Изменить время':'Добавить время')+'</h3>'+
        '<div class="sub">Для урока «'+escapeHtml(item.name)+'» — выберите день и укажите время</div>'+
        '<form id="schedule-time-form">'+
          '<input type="hidden" name="itemId" value="'+item.id+'">'+
          (editingTime?'<input type="hidden" name="timeId" value="'+editingTime.id+'">':'')+
          '<div class="field"><label>День недели</label><div class="day-toggles">'+
            DOW_VALUES.map(function(v,idx){
              var active = editingTime ? (editingTime.day===v) : (idx===0);
              return '<button type="button" class="day-toggle'+(active?' active':'')+'" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
            }).join('')+
          '</div><input type="hidden" name="day" value="'+(editingTime?editingTime.day:DOW_VALUES[0])+'"></div>'+
          '<div class="field"><label>Время</label><div class="field-row">'+
            '<input type="time" name="timeStart" value="'+(editingTime?editingTime.timeStart:'')+'">'+
            '<input type="time" name="timeEnd" value="'+(editingTime?editingTime.timeEnd:'')+'">'+
          '</div></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">'+(editingTime?'Сохранить':'Добавить')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderScheduleDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var dow = parseD(ds).getDay();
    var rows = [];
    ab.scheduleItems.forEach(function(it){
      it.times.forEach(function(t){
        if(t.day===dow) rows.push({item: it, t: t});
      });
    });
    rows.sort(function(a,b){ return (a.t.timeStart||'').localeCompare(b.t.timeStart||''); });
    var body = '';
    if(rows.length===0){
      body = '<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>';
    } else {
      rows.forEach(function(r){
        var it = r.item, t = r.t;
        var color = COLORS[it.color] || COLORS.amber;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(it.name)+'</span></div>';
        var timeStr = timeRangeStr(t);
        var b2 = (timeStr?'<div class="status">'+timeStr+'</div>':'')+(it.notes?'<div class="status dim">'+escapeHtml(it.notes)+'</div>':'')+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-schedule-time" data-item="'+it.id+'" data-time="'+t.id+'">Изменить время</button>'+
            '<button class="btn small danger" data-act="delete-schedule-time" data-item="'+it.id+'" data-time="'+t.id+'">Удалить</button>'+
          '</div>';
        body += '<div class="day-item">'+head+b2+'</div>';
      });
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        '<div class="sub">Расписание на этот день</div>'+
        body+
      '</div>'+
    '</div>';
  }

  function renderFinanceDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var items = '';
    var any = false;
    ab.income.forEach(function(inc){
      var color = COLORS[inc.color] || COLORS.amber;
      if(incomeOccursOn(inc, ds)){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(inc.name)+'</span><span class="mono" style="font-size:11px;color:var(--ink-dim);">'+fmtMoney(inc.amount, inc.currency)+'</span></div>';
        var body = (inc.scheduleType==='monthly' ? '<div class="status ok">Повторяется ежемесячно</div>' : '<div class="status">Разовый доход</div>')+
          '<div class="row-actions"><button class="btn small danger" data-act="delete-income" data-id="'+inc.id+'">Удалить</button></div>';
        items += '<div class="day-item">'+head+body+'</div>';
      }
      (inc.history||[]).filter(function(h){ return h.date===ds; }).forEach(function(h){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(inc.name)+' · пополнение</span><span class="mono" style="font-size:11px;color:var(--sage);">+'+fmtMoney(h.amount, inc.currency)+'</span></div>';
        var body = '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="income" data-item="'+inc.id+'" data-hist="'+h.id+'">Удалить запись</button></div>';
        items += '<div class="day-item">'+head+body+'</div>';
      });
    });
    ab.expenses.forEach(function(exp){
      var color = COLORS[exp.color] || COLORS.amber;
      (exp.history||[]).filter(function(h){ return h.date===ds; }).forEach(function(h){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(exp.name)+' · трата</span><span class="mono" style="font-size:11px;color:var(--rose);">-'+fmtMoney(h.amount, exp.currency)+'</span></div>';
        var body = '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="expense" data-item="'+exp.id+'" data-hist="'+h.id+'">Удалить запись</button></div>';
        items += '<div class="day-item">'+head+body+'</div>';
      });
    });
    if(!any){
      items = '<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        '<div class="sub">Финансы за этот день</div>'+
        items+
      '</div>'+
    '</div>';
  }

  function renderBalanceModal(){
    var ab = activeBoard();
    var editing = (state.editing && state.editing.kind==='balance') ? ab.balances.find(function(x){ return x.id===state.editing.id; }) : null;
    var rows = '';
    ab.balances.forEach(function(x){
      rows += ''+
        '<div class="day-item">'+
          '<div class="day-item-head">'+
            '<span class="nm">'+(x.label?escapeHtml(x.label)+' · ':'')+fmtMoney(x.amount, x.currency)+'</span>'+
          '</div>'+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-balance" data-id="'+x.id+'">Изменить</button>'+
            '<button class="btn small danger" data-act="delete-balance" data-id="'+x.id+'">Удалить</button>'+
          '</div>'+
        '</div>';
    });
    if(!rows){
      rows = '<div class="empty" style="padding:16px 6px;">Пока нет ни одной записи баланса.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">Баланс</h3>'+
        '<div class="sub">Добавьте баланс в своей валюте, а ниже — остальные (наличные, карта в другой валюте и т.д.)</div>'+
        rows+
        '<div class="drawer-hr"></div>'+
        '<form id="balance-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          '<div class="field"><label>Пометка (необязательно)</label><input type="text" name="label" placeholder="Например, карта или наличные" value="'+(editing?escapeHtml(editing.label||''):'')+'"></div>'+
          '<div class="field-row">'+
            '<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="'+(editing?editing.amount:'')+'" required></div>'+
            '<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">'+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          '<div class="modal-actions">'+
            (editing?'<button type="button" class="btn" data-act="cancel-edit-balance">Отмена</button>':'')+
            '<button type="submit" class="btn primary">'+(editing?'Сохранить':'Добавить')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderTransactionModal(){
    var t = state.transactionTarget;
    if(!t) return '';
    var ab = activeBoard();
    var list = t.kind==='income' ? ab.income : ab.expenses;
    var item = list.find(function(x){ return x.id===t.id; });
    if(!item) return '';
    var verb = t.kind==='income' ? 'доходу' : 'расходу';
    var effect = t.kind==='income' ? 'прибавится к выбранному счёту' : 'спишется с выбранного счёта';
    var matching = ab.balances.filter(function(x){ return x.currency===item.currency; });
    var accountField;
    if(matching.length){
      accountField = ''+
        '<div class="field"><label>Счёт</label><select name="balanceId">'+
          matching.map(function(x){
            var label = (x.label ? x.label+' · ' : '') + fmtMoney(x.amount, x.currency);
            return '<option value="'+x.id+'">'+escapeHtml(label)+'</option>';
          }).join('')+
          '<option value="">Не изменять баланс</option>'+
        '</select></div>';
    } else {
      accountField = '<div class="field-hint" style="margin-bottom:14px;">Нет счёта в валюте '+item.currency+' — сумма добавится к карточке, но баланс не изменится. Можно добавить счёт через «Баланс» в меню.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">Добавить сумму</h3>'+
        '<div class="sub">К «'+escapeHtml(item.name)+'» ('+verb+'), сейчас '+fmtMoney(item.amount, item.currency)+'. Сумма '+effect+'.</div>'+
        '<form id="transaction-form">'+
          '<div class="field"><label>Сумма ('+(CURRENCIES[item.currency]||item.currency)+')</label><input type="number" name="amount" min="0.01" step="0.01" placeholder="0" required></div>'+
          accountField+
          '<div class="field"><label>Дата траты</label><input type="date" name="date" value="'+fmt(todayD())+'" required></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">Отмена</button>'+
            '<button type="submit" class="btn primary">Добавить</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderRatesModal(){
    var ab = activeBoard();
    var keys = Object.keys(ab.rates);
    var rows = keys.map(function(k){
      var parts = k.split('_');
      var from = parts[0], to = parts[1];
      return ''+
        '<div class="day-item">'+
          '<div class="day-item-head"><span class="nm mono">1 '+from+' = '+ab.rates[k]+' '+to+'</span></div>'+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-rate" data-key="'+k+'">Изменить</button>'+
            '<button class="btn small danger" data-act="delete-rate" data-key="'+k+'">Удалить</button>'+
          '</div>'+
        '</div>';
    }).join('');
    if(!rows){
      rows = '<div class="empty" style="padding:16px 6px;">Пока нет сохранённых курсов.</div>';
    }
    var editingKey = (state.editing && state.editing.kind==='rate') ? state.editing.key : null;
    var editParts = editingKey ? editingKey.split('_') : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">Курсы валют</h3>'+
        '<div class="sub">Сохранённые курсы конвертации для колеса расходов</div>'+
        rows+
        '<div class="drawer-hr"></div>'+
        '<form id="rate-form">'+
          (editingKey?'<input type="hidden" name="oldKey" value="'+editingKey+'">':'')+
          '<div class="field-row">'+
            '<div class="field" style="flex:1;"><label>Из</label><select name="from">'+currencyOptionsHtml(editParts?editParts[0]:CURRENCY_KEYS[0])+'</select></div>'+
            '<div class="field" style="flex:1;"><label>В</label><select name="to">'+currencyOptionsHtml(editParts?editParts[1]:CURRENCY_KEYS[1])+'</select></div>'+
          '</div>'+
          '<div class="field"><label>Курс (1 «Из» = ? «В»)</label><input type="number" step="0.0001" min="0" name="value" value="'+(editingKey?ab.rates[editingKey]:'')+'" required></div>'+
          '<div class="modal-actions">'+
            (editingKey?'<button type="button" class="btn" data-act="cancel-edit-rate">Отмена</button>':'')+
            '<button type="submit" class="btn primary">'+(editingKey?'Сохранить':'Добавить курс')+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderTransactionHistoryModal(){
    var ab = activeBoard();
    var all = [];
    ab.income.forEach(function(inc){
      (inc.history||[]).forEach(function(h){
        all.push({kind:'income', itemId:inc.id, name:inc.name, color:inc.color, currency:inc.currency, h:h});
      });
    });
    ab.expenses.forEach(function(exp){
      (exp.history||[]).forEach(function(h){
        all.push({kind:'expense', itemId:exp.id, name:exp.name, color:exp.color, currency:exp.currency, h:h});
      });
    });
    all.sort(function(a,b){ return a.h.date < b.h.date ? 1 : (a.h.date > b.h.date ? -1 : 0); });
    var rows = all.map(function(t){
      var color = COLORS[t.color] || COLORS.amber;
      var sign = t.kind==='income' ? '+' : '-';
      var signColor = t.kind==='income' ? 'var(--sage)' : 'var(--rose)';
      return ''+
        '<div class="day-item">'+
          '<div class="day-item-head">'+
            '<span class="dot" style="background:'+color+'"></span>'+
            '<span class="nm">'+escapeHtml(t.name)+'</span>'+
            '<span class="mono" style="font-size:11px;color:'+signColor+';">'+sign+fmtMoney(t.h.amount, t.currency)+'</span>'+
          '</div>'+
          '<div class="status">'+fmtHuman(t.h.date)+'</div>'+
          '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="'+t.kind+'" data-item="'+t.itemId+'" data-hist="'+t.h.id+'">Удалить</button></div>'+
        '</div>';
    }).join('');
    if(!rows){
      rows = '<div class="empty" style="padding:16px 6px;">Пока нет ни одной транзакции.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">История транзакций</h3>'+
        '<div class="sub">Все пополнения и траты по карточкам этой доски, от новых к старым</div>'+
        rows+
      '</div>'+
    '</div>';
  }

  function renderMenuDrawer(){
    var boardsHtml = state.boards.map(function(b){
      var active = b.id===state.activeBoardId;
      var tag = '<span class="mono dim" style="font-size:10px;">'+BOARD_TYPE_LABELS[b.type]+'</span>';
      return '<div class="board-row'+(active?' active':'')+'">'+
        '<button class="board-name" data-act="switch-board" data-id="'+b.id+'">'+escapeHtml(b.name)+' '+tag+'</button>'+
        (state.boards.length>1 ? '<button class="icon-btn tiny" data-act="delete-board" data-id="'+b.id+'" title="Удалить доску">✕</button>' : '')+
      '</div>';
    }).join('');

    var typePickerOptions = '';
    if(state.boardTypePickerOpen){
      typePickerOptions = '<div class="board-type-options">'+
        BOARD_TYPES.map(function(t){
          return '<button type="button" class="toggle-btn'+(state.newBoardType===t?' active':'')+'" data-boardtype="'+t+'">'+BOARD_TYPE_LABELS[t]+'</button>';
        }).join('')+
      '</div>';
    }

    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-menu">✕</button>'+
        '<h3 class="display">Доски</h3>'+
        '<div class="sub">Переключайтесь между календарями или создайте новый</div>'+
        '<div class="board-list">'+boardsHtml+'</div>'+
        '<div class="drawer-hr"></div>'+
        '<div class="field">'+
          '<label>Новая доска</label>'+
          '<button type="button" class="btn" style="width:100%;justify-content:space-between;display:flex;" data-act="toggle-boardtype-picker">'+
            '<span>Выбрать тип доски: '+BOARD_TYPE_LABELS[state.newBoardType]+'</span><span>'+(state.boardTypePickerOpen?'▲':'▼')+'</span>'+
          '</button>'+
          typePickerOptions+
          '<div class="field-row" style="margin-top:10px;"><input type="text" id="new-board-name" placeholder="Название доски"><button class="btn primary" data-act="create-board">+</button></div>'+
        '</div>'+
        '<div class="drawer-hr"></div>'+
        '<button type="button" class="btn" style="width:100%;" data-act="open-settings">⚙ Настройки</button>'+
      '</div>'+
    '</div>';
  }

  function renderSettingsModal(){
    var ab = activeBoard();
    var link = shareLinkFor(ab);
    var qrSvg = generateShareQrSvg(link);
    var qrBlockHtml;
    if(qrSvg){
      qrBlockHtml = '<div style="background:#fff;padding:12px;border-radius:10px;width:220px;max-width:100%;margin:12px auto;">'+qrSvg+'</div>';
    } else {
      qrBlockHtml = '<div class="field-hint" style="margin:10px 0;">Доска слишком большая для QR-кода — поделитесь ссылкой ниже.</div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">Настройки</h3>'+
        '<div class="sub">Тема оформления и обмен доской</div>'+
        '<div class="field">'+
          '<label>Тема</label>'+
          '<div class="toggle-row">'+
            '<button type="button" class="toggle-btn'+(state.theme==='dark'?' active':'')+'" data-act="set-theme" data-theme="dark">Тёмная</button>'+
            '<button type="button" class="toggle-btn'+(state.theme==='light'?' active':'')+'" data-act="set-theme" data-theme="light">Светлая</button>'+
          '</div>'+
        '</div>'+
        '<div class="drawer-hr"></div>'+
        '<div class="field">'+
          '<label>Поделиться доской</label>'+
          qrBlockHtml+
          '<div class="field-row">'+
            '<input type="text" class="mono" readonly value="'+escapeHtml(link)+'" onclick="this.select()" style="flex:1;">'+
            '<button class="btn small" data-act="copy-link" data-link="'+escapeHtml(link)+'">Копировать</button>'+
          '</div>'+
          '<div class="sub" style="margin:8px 0 0;">Отсканируйте QR-код камерой или перешлите ссылку — открывший её человек сможет добавить себе копию доски. После изменений откройте это меню снова, чтобы получить обновлённые QR-код и ссылку.</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  // ---------- event handling ----------
  function attachHandlers(){
    app.querySelectorAll('[data-act]').forEach(function(el){
      el.addEventListener('click', function(ev){ handleAction(el, ev); });
    });
    app.querySelectorAll('[data-stop]').forEach(function(el){
      el.addEventListener('click', function(ev){ ev.stopPropagation(); });
    });
    app.querySelectorAll('.overlay').forEach(function(overlay){
      overlay.addEventListener('click', function(ev){
        if(ev.target===overlay){ state.modal=null; state.menuOpen=false; state.editing=null; state.transactionTarget=null; state.scheduleTimeTarget=null; render(); }
      });
    });

    var addForm = document.getElementById('add-form');
    if(addForm){
      var editingSubjId = (addForm.querySelector('input[name=editId]')||{}).value;
      var editingSubj = editingSubjId ? activeBoard().subjects.find(function(x){ return x.id===editingSubjId; }) : null;
      var selectedDays = editingSubj ? editingSubj.days.slice() : [];
      var colorInput = addForm.querySelector('input[name=color]');
      var planInput = addForm.querySelector('input[name=planType]');
      addForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput.value = sw.dataset.color;
        });
      });
      addForm.querySelectorAll('.day-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){
          var v = Number(btn.dataset.day);
          var idx = selectedDays.indexOf(v);
          if(idx===-1){ selectedDays.push(v); btn.classList.add('active'); }
          else { selectedDays.splice(idx,1); btn.classList.remove('active'); }
        });
      });
      addForm.querySelectorAll('[data-plan]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addForm.querySelectorAll('[data-plan]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          planInput.value = btn.dataset.plan;
          addForm.querySelectorAll('[data-plan-field]').forEach(function(f){
            f.style.display = (f.dataset.planField===btn.dataset.plan) ? '' : 'none';
          });
        });
      });
      addForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        if(selectedDays.length===0){ showToast('Выберите хотя бы один день недели'); return; }
        var fd = new FormData(addForm);
        var planType = fd.get('planType') || 'dynamic';
        var payload = {
          name: (fd.get('name')||'').toString().trim() || 'Без названия',
          color: fd.get('color'),
          days: selectedDays.slice(),
          startDate: fd.get('startDate'),
          planType: planType,
          timeStart: fd.get('timeStart') || '',
          timeEnd: fd.get('timeEnd') || ''
        };
        if(planType==='static'){
          var paidUntil = fd.get('paidUntil');
          if(!paidUntil){ showToast('Укажите дату, до которой оплачено'); return; }
          payload.paidUntil = paidUntil;
        } else {
          payload.total = Math.max(1, parseInt(fd.get('total'),10) || 1);
        }
        var editSubjId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editSubjId){ updateSubject(editSubjId, payload); } else { addSubject(payload); }
      });
    }

    var addEventForm = document.getElementById('add-event-form');
    if(addEventForm){
      var colorInput2 = addEventForm.querySelector('input[name=color]');
      addEventForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addEventForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput2.value = sw.dataset.color;
        });
      });
      addEventForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addEventForm);
        var payload = {
          name: (fd.get('name')||'').toString().trim() || 'Без названия',
          color: fd.get('color'),
          date: fd.get('date'),
          yearly: !!fd.get('yearly')
        };
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateEvent(editId, payload); } else { addEvent(payload); }
      });
    }

    var addScheduleForm = document.getElementById('add-schedule-form');
    if(addScheduleForm){
      var colorInputS = addScheduleForm.querySelector('input[name=color]');
      addScheduleForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addScheduleForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInputS.value = sw.dataset.color;
        });
      });
      addScheduleForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addScheduleForm);
        var payload = {
          name: (fd.get('name')||'').toString().trim() || 'Без названия',
          color: fd.get('color'),
          notes: (fd.get('notes')||'').toString().trim()
        };
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateScheduleItem(editId, payload); } else { addScheduleItem(payload); }
      });
    }

    var scheduleTimeForm = document.getElementById('schedule-time-form');
    if(scheduleTimeForm){
      var dayInputT = scheduleTimeForm.querySelector('input[name=day]');
      scheduleTimeForm.querySelectorAll('.day-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){
          scheduleTimeForm.querySelectorAll('.day-toggle').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          dayInputT.value = btn.dataset.day;
        });
      });
      scheduleTimeForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(scheduleTimeForm);
        var payload = {
          day: Number(fd.get('day')),
          timeStart: fd.get('timeStart') || '',
          timeEnd: fd.get('timeEnd') || ''
        };
        var itemId = fd.get('itemId');
        var timeId = fd.get('timeId');
        state.modal = null;
        state.editing = null;
        state.scheduleTimeTarget = null;
        if(timeId){ updateScheduleTime(itemId, timeId, payload); } else { addScheduleTime(itemId, payload); }
      });
    }

    var addIncomeForm = document.getElementById('add-income-form');
    if(addIncomeForm){
      var colorInput3 = addIncomeForm.querySelector('input[name=color]');
      var scheduleInput = addIncomeForm.querySelector('input[name=scheduleType]');
      addIncomeForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addIncomeForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput3.value = sw.dataset.color;
        });
      });
      addIncomeForm.querySelectorAll('[data-schedule]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addIncomeForm.querySelectorAll('[data-schedule]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          scheduleInput.value = btn.dataset.schedule;
          addIncomeForm.querySelectorAll('[data-schedule-field]').forEach(function(f){
            f.style.display = (f.dataset.scheduleField===btn.dataset.schedule) ? '' : 'none';
          });
        });
      });
      addIncomeForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addIncomeForm);
        var amount = parseFloat(fd.get('amount'));
        if(isNaN(amount) || amount<0){ showToast('Укажите сумму'); return; }
        var scheduleType = fd.get('scheduleType') || 'once';
        var payload = {
          name: (fd.get('name')||'').toString().trim() || 'Без названия',
          color: fd.get('color'),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY,
          scheduleType: scheduleType
        };
        if(scheduleType==='monthly'){
          payload.dayOfMonth = Math.min(28, Math.max(1, parseInt(fd.get('dayOfMonth'),10) || 1));
        } else {
          if(!fd.get('date')){ showToast('Укажите дату'); return; }
          payload.date = fd.get('date');
        }
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateIncome(editId, payload); } else { addIncome(payload); }
      });
    }

    var addExpenseForm = document.getElementById('add-expense-form');
    if(addExpenseForm){
      var colorInput4 = addExpenseForm.querySelector('input[name=color]');
      addExpenseForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addExpenseForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput4.value = sw.dataset.color;
        });
      });
      addExpenseForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addExpenseForm);
        var amount = parseFloat(fd.get('amount'));
        if(isNaN(amount) || amount<0){ showToast('Укажите сумму'); return; }
        var payload = {
          name: (fd.get('name')||'').toString().trim() || 'Без названия',
          color: fd.get('color'),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY
        };
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateExpense(editId, payload); } else { addExpense(payload); }
      });
    }

    var balanceForm = document.getElementById('balance-form');
    if(balanceForm){
      balanceForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(balanceForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast('Укажите сумму'); return; }
        var payload = {
          label: (fd.get('label')||'').toString().trim(),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY
        };
        var editId = fd.get('editId');
        state.editing = null;
        if(editId){ updateBalance(editId, payload); } else { addBalance(payload); }
      });
    }

    var transactionForm = document.getElementById('transaction-form');
    if(transactionForm){
      transactionForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(transactionForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast('Укажите сумму'); return; }
        var balanceId = fd.get('balanceId') || null;
        var date = fd.get('date') || fmt(todayD());
        var t = state.transactionTarget;
        state.modal = null;
        state.transactionTarget = null;
        var balanceFound = addTransaction(t.kind, t.id, amount, balanceId, date);
        if(balanceId && balanceFound===false){ showToast('Добавлено, но счёт не найден — баланс не изменён.'); }
      });
    }

    var rateForm = document.getElementById('rate-form');
    if(rateForm){
      rateForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(rateForm);
        var from = fd.get('from'), to = fd.get('to');
        var val = parseFloat(fd.get('value'));
        if(!(val>0)){ showToast('Укажите курс'); return; }
        if(from===to){ showToast('Валюты должны различаться'); return; }
        var oldKey = fd.get('oldKey');
        var b = activeBoard();
        if(oldKey && oldKey!==(from+'_'+to)) delete b.rates[oldKey];
        b.rates[from+'_'+to] = val;
        state.editing = null;
        saveData();
      });
    }

    app.querySelectorAll('[data-boardtype]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var nameVal = (document.getElementById('new-board-name')||{}).value || '';
        state.newBoardType = btn.dataset.boardtype;
        state.boardTypePickerOpen = false;
        render();
        var nameInput2 = document.getElementById('new-board-name');
        if(nameInput2) nameInput2.value = nameVal;
      });
    });
  }

  var toastTimer = null;
  function showToast(msg){
    var t = document.getElementById('app-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'app-toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      if(t && t.parentNode) t.parentNode.removeChild(t);
    }, 2400);
  }

  function copyText(text, okMsg){
    if(!text){ showToast('Нечего копировать'); return; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ showToast(okMsg); })
        .catch(function(){ showToast('Не удалось скопировать автоматически'); });
    } else {
      showToast('Скопируйте текст вручную из поля');
    }
  }

  function handleAction(el, ev){
    var act = el.dataset.act;
    switch(act){
      case 'prev-month':
        state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth()-1, 1);
        render(); break;
      case 'next-month':
        state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth()+1, 1);
        render(); break;
      case 'today':
        state.viewDate = startOfMonth(todayD());
        render(); break;
      case 'finance-view':
        state.financeView = el.dataset.view === 'expenses' ? 'expenses' : 'income';
        render(); break;
      case 'set-theme':
        setTheme(el.dataset.theme);
        break;
      case 'refresh-rates':
        refreshRatesFromApi(el.dataset.to);
        break;
      case 'open-add':
        state.modal = 'add'; state.menuOpen = false; state.editing = null; state.scheduleTimeTarget = null; render(); break;
      case 'close-modal':
        state.modal = null; state.editing = null; state.transactionTarget = null; state.scheduleTimeTarget = null; render(); break;
      case 'open-menu':
        state.menuOpen = true; state.modal = null; state.newBoardType = 'lessons'; state.boardTypePickerOpen = false; render(); break;
      case 'close-menu':
        state.menuOpen = false; render(); break;
      case 'toggle-boardtype-picker':
        (function(){
          var nameVal = (document.getElementById('new-board-name')||{}).value || '';
          state.boardTypePickerOpen = !state.boardTypePickerOpen;
          render();
          var nameInput3 = document.getElementById('new-board-name');
          if(nameInput3) nameInput3.value = nameVal;
        })();
        break;
      case 'open-settings':
        state.modal = 'settings'; state.menuOpen = false; render(); break;
      case 'open-day':
        state.selectedDate = el.dataset.date; state.modal = 'day'; state.menuOpen = false; render(); break;
      case 'delete-subject':
        ev.stopPropagation();
        deleteSubject(el.dataset.id);
        break;
      case 'edit-subject':
        ev.stopPropagation();
        state.editing = {kind:'subject', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-event':
        ev.stopPropagation();
        deleteEvent(el.dataset.id);
        break;
      case 'edit-event':
        ev.stopPropagation();
        state.editing = {kind:'event', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-income':
        ev.stopPropagation();
        deleteIncome(el.dataset.id);
        break;
      case 'delete-expense':
        ev.stopPropagation();
        deleteExpense(el.dataset.id);
        break;
      case 'edit-schedule-item':
        ev.stopPropagation();
        state.editing = {kind:'schedule', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-schedule-item':
        ev.stopPropagation();
        deleteScheduleItem(el.dataset.id);
        break;
      case 'add-schedule-time':
        ev.stopPropagation();
        state.scheduleTimeTarget = el.dataset.item;
        state.editing = null;
        state.modal = 'schedule-time';
        render();
        break;
      case 'edit-schedule-time':
        ev.stopPropagation();
        state.editing = {kind:'scheduletime', itemId: el.dataset.item, timeId: el.dataset.time};
        state.scheduleTimeTarget = null;
        state.modal = 'schedule-time';
        render();
        break;
      case 'delete-schedule-time':
        ev.stopPropagation();
        deleteScheduleTime(el.dataset.item, el.dataset.time);
        break;
      case 'pick-schedule-day':
        state.scheduleDay = Number(el.dataset.day);
        render();
        break;
      case 'delete-transaction':
        ev.stopPropagation();
        deleteTransaction(el.dataset.kind, el.dataset.item, el.dataset.hist);
        break;
      case 'edit-income':
        ev.stopPropagation();
        state.editing = {kind:'income', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'edit-expense':
        ev.stopPropagation();
        state.editing = {kind:'expense', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'add-transaction':
        ev.stopPropagation();
        state.transactionTarget = {kind: el.dataset.kind, id: el.dataset.id};
        state.modal = 'transaction';
        render();
        break;
      case 'open-balance':
        state.modal = 'balance'; state.menuOpen = false; state.editing = null; render(); break;
      case 'edit-balance':
        state.editing = {kind:'balance', id: el.dataset.id};
        render();
        break;
      case 'cancel-edit-balance':
        state.editing = null;
        render();
        break;
      case 'delete-balance':
        ev.stopPropagation();
        if(state.editing && state.editing.kind==='balance' && state.editing.id===el.dataset.id) state.editing = null;
        deleteBalance(el.dataset.id);
        break;
      case 'open-rates':
        state.modal = 'rates'; state.menuOpen = false; state.editing = null; render(); break;
      case 'edit-rate':
        state.editing = {kind:'rate', key: el.dataset.key};
        render();
        break;
      case 'cancel-edit-rate':
        state.editing = null;
        render();
        break;
      case 'delete-rate':
        ev.stopPropagation();
        if(state.editing && state.editing.kind==='rate' && state.editing.key===el.dataset.key) state.editing = null;
        (function(){
          var b = activeBoard();
          delete b.rates[el.dataset.key];
          saveData();
        })();
        break;
      case 'open-history':
        state.modal = 'history'; state.menuOpen = false; state.editing = null; render(); break;
      case 'cancel':
        cancelOccurrence(el.dataset.subj, el.dataset.date);
        break;
      case 'restore':
        restoreOccurrence(el.dataset.subj, el.dataset.date);
        break;
      case 'show-resched':
        var box = app.querySelector('.resched-box[data-subj-box="'+el.dataset.subj+'"][data-date-box="'+el.dataset.date+'"]');
        if(box) box.style.display = 'block';
        break;
      case 'confirm-resched':
        var box2 = el.closest('.resched-box');
        var inp = box2.querySelector('input[type=date]');
        if(inp && inp.value){
          rescheduleOccurrence(el.dataset.subj, el.dataset.date, inp.value);
        }
        break;
      case 'switch-board':
        switchBoard(el.dataset.id);
        break;
      case 'delete-board':
        ev.stopPropagation();
        deleteBoard(el.dataset.id);
        break;
      case 'create-board':
        var nameInput = document.getElementById('new-board-name');
        createBoard(nameInput ? nameInput.value : '', state.newBoardType);
        break;
      case 'copy-link':
        copyText(el.dataset.link, 'Ссылка скопирована');
        break;
      case 'accept-import':
        acceptImport();
        break;
      case 'dismiss-import':
        dismissImport();
        break;
    }
  }

  app.addEventListener('change', function(ev){
    var t = ev.target;
    if(t && t.dataset && t.dataset.act==='edit-total'){
      var v = Math.max(0, parseInt(t.value,10) || 0);
      updateTotal(t.dataset.id, v);
    }
    if(t && t.dataset && t.dataset.act==='edit-paiduntil'){
      updatePaidUntil(t.dataset.id, t.value);
    }
    if(t && t.dataset && t.dataset.act==='set-wheel-currency'){
      var b = activeBoard();
      b.wheelCurrency = t.value;
      saveData();
    }
    if(t && t.dataset && t.dataset.act==='set-rate'){
      var rateVal = parseFloat(t.value);
      if(rateVal>0){
        var b2 = activeBoard();
        b2.rates[t.dataset.from+'_'+t.dataset.to] = rateVal;
        saveData();
      }
    }
  });

  loadData();
})();
