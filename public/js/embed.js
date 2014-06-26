/* Source from Newspad ver. 1
Copyright (c) Microsoft Corporation
All rights reserved. 
Licensed under the Apache License, Version 2.0 (the ""License""); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 
THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT. 
See the Apache Version 2.0 License for specific language governing permissions and limitations under the License.
*/

d = document;
p=/^http:/.test(d.location)?'http':'https';

nl = d.getElementById("genderavenger-tally")
var iframe = d.createElement('iframe');       
nl.parentNode.insertBefore(iframe, nl);

//iframe.src = "http://app.genderavenger.com/plot/" + nl.getAttribute("data-tally-id")";
iframe.src = "http://localhost:3000/embed/" + nl.getAttribute("data-tally-id");
iframe.width = "200";
iframe.height = "200";

width = nl.getAttribute("data-width");
height = nl.getAttribute("data-height");
style = nl.getAttribute("data-style");
if(width!=null && width.length > 0){
  iframe.width = width;
}
if(height!=null && height.length > 0){
  iframe.height = height;
}
if(style!=null){
  iframe.style=style;
}
nl.parentNode.removeChild(nl);
