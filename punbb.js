// convert the BBCode tag
var j;
var posts = document.getElementsByClassName("entry-content");
for (j = 0; j < posts.length; j++) {
  var post = posts[j];
  var thishtml = post.innerHTML;
  var scripts = [];
  var i;
  for (i = 0; i < thishtml.split("[scratchblocks]").length - 1; i++) {
    var script = thishtml.split("[scratchblocks]")[i+1].split("[/scratchblocks]")[0];
    scripts[i] = script;
  }

  for (i = 0; i < scripts.length; i++) {
    thishtml = thishtml.replace(/\[scratchblocks\](.+?)\[\/scratchblocks\]/i, "<pre class=\"blocks\">"+scripts[i]+"</pre>");
  }

  post.innerHTML = thishtml;
}

var blocks = document.getElementsByClassName("blocks");
var i;
for (i=0; i<blocks.length; i++) {
  if (blocks[i].innerText) {
    blocks[i].innerHTML = blocks[i].innerText;
  }
  else {
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/<br \/>/gi, "\r\n");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/<br>/gi, "\r\n");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/&/g, "&amp;");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/</g, "&lt;");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/>/g, "&gt;");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/"/g, "&quot;");
    blocks[i].innerHTML = blocks[i].innerHTML.replace(/'/, "'");
  }
}

function parse() {
  scratchBlocksPlugin.parse({containerTag: 'pre', containerClass: 'blocks'});
}
/*

Scratch Blocks Plugin
 - Joren Lauwers 2011

=======================

Scratch is a project by the Lifelong Kindergarten Group at the MIT Media Lab
scratch.mit.edu
llk.media.mit.edu

=======================

Example Usage:

scratchBlocksPlugin.parse({
	containerTag: 'pre',
	containerClass: 'blocks'
})

*/

scratchBlocksPlugin = {
	parse: function(settings) {
		for (var prop in settings) {
			this.config[prop] = settings[prop];
		}
		/*if (settings.staticDir!==undefined) {
			this.config.staticDir = settings.staticDir;
		}*/
		//apply config
		this.styles['commentbox'] += 'background-color: ' + this.config.commentBackground + '; ';
		
		//loop through containers and pass their content to parseScript
		var containers = this.getScriptContainers(settings.containerClass, settings.containerTag);
		for (var i = 0; i < containers.length; i++) {
			containers[i].innerHTML = this.parseScript( containers[i].innerHTML + '') + '<br>';
			containers[i].style.whiteSpace = 'normal';
		}
	},
	parseScript: function(script) {
		script = this.trim(script);
		//decode html special chars
		script = script.replace(/&amp;/g,'&');
		script = script.replace(/&lt;/g,'<');
		script = script.replace(/&gt;/g,'>');
		script = script.replace(/&quot;/g,'"');
		
		//split the script into lines
		script=script.split("\n");
		var out = '';
		var comment = '';
		for (var i =0; i < script.length; i++) {
			//ignore whitelines etc.
			if (script[i].length>2) {
				comment = '';
				if (script[i].indexOf('//')>=0) {
					comment = script[i].substring(script[i].indexOf('//')+2);
					script[i] = script[i].substring(0,script[i].indexOf('//'));
					//comment = this.trim(comment);
					comment = this.parseComment(comment);
				}
				out += this.parseBlock(script[i], false, i, comment);
			}
		}
		out += this.closeOpenedCs();
		//revert the < and >'s back to their encoded version to avoid html syntax trouble
		return out;
	},
	parseBlock: function(block, parentColor, nr, comment) {
		var type = '';
		var color = '';
		var open = '';
		var close = '';
		var opened = 0;
		var blockname = '';
		var info = 0;
		var out = '';
		var param = '';
		var c = '';
		var i = 0;
		if (!parentColor)
			var parentColor = false;
		if (!nr)
			var nr = 0;
		if (!comment)
			var comment = '';
		
		//remove spaces or line break characters
		block = this.trim(block);

		//replace < and > in operator block labels (less than, more than)
		//they mess up the syntax
		block = block.replace('> > <', '> &gt; <');
		block = block.replace('> < <', '> &lt; <');
		block = block.replace(') > (', ') &gt; (');
		block = block.replace(') < (', ') &lt; (');
		block = block.replace('] > [', '] &gt; [');
		block = block.replace('] < [', '] &lt; [');

		block = block.replace(') < [', ') &lt; [');
		block = block.replace(') > [', ') &gt; [');
		block = block.replace('] < (', '] &lt; (');
		block = block.replace('] > (', '] &gt; (');

		//use far right and left characters as type identifiers
		typeidentifier = block.charAt(0) + block.charAt(block.length-1);
		
		switch (typeidentifier) {
			case '()':
				type = 'reporter';
				break;
			case '<>':
				type = 'boolean';
				break;
			case '[]':
				type = 'string';
				break;
			default:
				type = 'stack';				
		}
		
		//remove possible type identifiers from block variable
		if (type != 'stack') {
			block = this.trim(block.substring(1,block.length-1));
		}
		
		//find blockname (no params or spaces)
		open = '';
		close = '';
		opened = 0;
		blockname = '';
		for (i = 0; i<block.length; i++) {
			c = block.charAt(i);
			if (opened>0) {
				if (c==open)
					opened ++;
				if (c==close)
					opened --;
			} else if (c=='(') {
				open = '(';
				close = ')';
				opened ++;
			} else if (c=='[') {
				open = '[';
				close = ']';
				opened ++;
			} else if (c=='<') {
				open = '<';
				close = '>';
				opened ++;
			} else {
				blockname += this.trim(c);
			}
		}
		
		//blockname should be all lower case
		blockname = blockname.toLowerCase();
		
		//alternative blocknames (usually when the blocks have icons in them)
		switch (blockname) {
			case 'whengfclicked':
				blockname = 'whenflagclicked';
				break;
			case 'whengreenflagclicked':
				blockname = 'whenflagclicked';
				break;
			case 'turnleftdegrees':
			case 'turncounterclockwisedegrees':
				blockname = 'turnccwdegrees';
				break;
			case 'turnrightdegrees':
			case 'turnclockwisedegrees':
				blockname = 'turncwdegrees';
				break;
		}
		
		//check if the 'block' is a string input or dropdown or color gap
		if (type=='string') {
			if (block.substring(block.length-2)==' v') {
				//dropdown box;
				type = 'dropdown';
				block = block.substring(0,block.length-2)
				out += '<div style="' + this.styles['gap_dropdown'] + this.styles['gapborder_' + parentColor] + this.styles['dropdownbg_' + parentColor]+ '">' + this.encodehtml(block) + ' <span style="color: #404040">&#x25BC;</span></div>';
			} else if (block.substring(0,1)=='#' && block.length==7) {
				type = 'color';
				out += '<div style="' + this.styles['gap_color'] + this.styles['gapborder_' + parentColor] + ' background-color: ' + this.encodehtml(block) + ';"></div>';
			}else {
				//actual string
				if (block=='') {
					out += '<div style="' + this.styles['gap_text'] + this.styles['gapborder_' + parentColor] + '">&nbsp;</div>';
				} else {
					out += '<div style="' + this.styles['gap_text'] + this.styles['gapborder_' + parentColor] + '">' + this.encodehtml(block) + '</div>';
				}
			}
			return out;
		}
		
		if (type=='boolean' && block=='') {
			out += '<div style="' + this.styles['gap_boolean'] + this.styles['gapborder_' + parentColor] + this.styles['dropdownbg_' + parentColor]+ '">&nbsp;</div>';
			return out;
		}
		
		//get info from block lib
		if (this.blocksLib[blockname]) {
			info = this.blocksLib[blockname];
			//set color
			color = info[0];
		} else if (type=='reporter') {
			//might be a variable, number input field or dropdown number input field
			if (block.match(/^[0-9\.,-]+$/)) {
				//number input field: contains only numbers, dots and commas.
				out = '<div style="' + this.styles['gap_number'] + '">' + block + '</div>'; //this.styles['gapborder_' + parentColor] is possible
				return out;
			} else if (block=='') {
				out = '<div style="' + this.styles['gap_number'] + '">&nbsp;</div>';
				return out;
			}else if (block.substring(block.length-2)==' v') { // && block.substring(0,block.length-2).match(/^[0-9\.,-]+/)
				//number input dropdown field.
				out = '<div style="' + this.styles['gap_number'] + '">' + block.substring(0,block.length-2) + '  <span style="color: #404040">&#x25BC;</span></div>'; //this.styles['gapborder_' + parentColor] is possible
				return out;
			} else {
				//variable
				out = '<div style="' + this.styles['block_reporter'] + this.styles['orange'] + '">' + this.encodehtml(block) + '</div>';
				return out;
			}
		} else {
			//obsolete
			color = 'red';
		}
		
		//we found a block in the blockslib that matches the one we're interpreting
		if (!(info && type==info[1])) {
			//the type of the block derived from the syntax doesn't match with the one from the blockslib
			if (type=='reporter') {
				//reporter is a variable (with the name of an existing block)
				out = '<div style="' + this.styles['block_reporter'] + this.styles['orange'] + '">' + this.encodehtml(block) + '</div>';
				return out;
			} else if (info && info[1] == 'cend') {
				//only add a C ending when we actually have a C to close
				if (this.openedCs>0) {
					out += '</div><div style="' + this.styles['cend'] + this.styles['yellow'] + '"><div style="' + this.styles['puzzletop'] + this.styles['puzzle_yellow'] + 'left: 21px;"></div>';
					//possibly add a condition here to filter forever blocks
					out += '<div style="' + this.styles['puzzlebottom'] + this.styles['yellow'] + '"></div>'
					
					out += '</div>'
					this.openedCs --;
				}
				return out;
			} else if (info && info[1]=='hat') {
				out += this.closeOpenedCs();
				type = info[1];
			} else if (info && (info[1]=='cstart' || info[1]=='cend' || info[1]=='cseparator')) {
				type = info[1];
			} else {
				//the types don't match and the type is not an exception. hmmm.
				//return 0;
			}
		}
		
		//hack for the double 'of' block color
		//'of' could be sensing (lightblue) or operators (lightgreen)
		if (blockname=='of' && block.substr(block.length-2)=='v]') {
			color = 'lightblue';
		}
		
		//hack for the double 'lengthof' block color
		//'lengthof' could be operators (lightgreen) or lists/variables (darkorange)
		if (blockname=='lengthof' && block.substr(block.length-2)=='v]') {
			color = 'darkorange';
		}
		
		
		//don't allow user icon or config injection
		block = block.replace(/::icon:/g, '');
		block = block.replace(/::config:/g, '');
		
		//put icon placeholders in place (no html yet, the block is still to be parsed recursively)
		if (blockname=='whenflagclicked'&&type=='hat') {
			block = block.replace('gf', '::icon:gf::');
			block = block.replace('green flag', '::icon:gf::');
			block = block.replace('flag', '::icon:gf::');
		}
		if (blockname=='turncwdegrees'&&type=='stack') {
			block = block.replace('cw', '::icon:cw::');
			block = block.replace('right', '::icon:cw::');
		}
		if (blockname=='turnccwdegrees'&&type=='stack') {
			block = block.replace('ccw', '::icon:ccw::');
			block = block.replace('left', '::icon:ccw::');
		}
		if (blockname=='stopall'&&type=='stack') {
			block += '::icon:stop::';
		}
		
		//start block output for regular types
		out += '<div style="' + this.styles['block_' + type] + this.styles[color] + '">';
		
		//add top puzzle shape if necessary
		if (type=='stack' || type=='cstart' || type=='cseparator') {
			out += '<div style="' + this.styles['puzzletop'] + this.styles['puzzle_'+color];
			if (type=='cseparator') {
				out += 'left: 12px;';
			}
			if (nr==0) {
				out += 'background-color: #FFFFFF !important;';
			}
			out += '"></div>';
		}
		
		open = '';
		close = '';
		opened = 0;
		param = '';
		for (i = 0; i<block.length; i++) {
			c = block.charAt(i);
			if (opened>0) {
				param += c;
				if (c==open)
					opened ++;
				if (c==close)
					opened --;
				if (opened==0) {
					//We found the bracket that matches the first opened one.
					out += this.parseBlock(param, color);
					param = '';
					open = '';
					close = '';
				}
			} else if (c=='(') {
				open = '(';
				close = ')';
				param = c;
				opened ++;
			} else if (c=='[') {
				open = '[';
				close = ']';
				param = c;
				opened ++;
			} else if (c=='<') {
				open = '<';
				close = '>';
				param = c;
				opened ++;
			} else {
				out += c;
			}
		}
		
		//POST BLOCK CONTENT
		
		//add hat ending if required
		if (type=='hat') {
			out += '<div style="' + this.styles['hatrightedge'] + '"></div>';
		}
		
		//add bottom puzzle shape
		if ((type=='stack' || type=='cstart' || type=='hat' || type=='cseparator') && blockname!='stopscript' && blockname!='stopall') {
			out += '<div style="' + this.styles['puzzlebottom'] + this.styles[color];
			if (type=='hat') {
				out += 'bottom: -4px; left: 11px;';
			}
			if (type=='cseparator') {
				out += 'left: 12px;';
			}
			if (type=='cstart') {
				out += 'left: 22px;';
			}
			out += '"></div>';
		}
		//BLOCK CLOSURE
		out += comment + "</div>";
		
		//POST BLOCK CLOSURE

		
		//add a wrapper for the content of a C block
		if (type=='cstart') {
			out += '<div style="' + this.styles['cwrap'] + '">';
			this.openedCs ++;
		}
		
		//OUTPUT MANIPULATION
		
		//put icons in place
		out = out.replace(/::icon:cw::/g, '<img src="' + this.config.staticDir + 'cw.png" style="' + this.styles['icon']+'"></img>');
		out = out.replace(/::icon:ccw::/g, '<img src="' + this.config.staticDir + 'ccw.png" style="' + this.styles['icon']+'"></img>');
		out = out.replace(/::icon:gf::/g, '<img src="' + this.config.staticDir + 'gf.png" style="' + this.styles['icon_hat']+'"></img>');
		out = out.replace(/::icon:stop::/g, '<img src="' + this.config.staticDir + 'stop.png" style="' + this.styles['icon']+'"></img>');

 		out = out.replace(/::config:staticDir::/g, this.config.staticDir);
		
		return out;
	},
	parseComment: function(comment) {
		var out = '';
		out += '<div style="' + this.styles['commentholder'] + '"><div style="' + this.styles['commentline'] + '"></div><div style="' + this.styles['commentbox'] + '">' + this.encodehtml(comment) + '</div></div>';
		return out;
	},
	getScriptContainers: function(cl, tag) {
		if (!tag) tag='*';
		var retnode = [];
		var myclass = new RegExp('\\b'+cl+'\\b');
		var elem = document.getElementsByTagName(tag);
		for (var i = 0; i < elem.length; i++) {
			var classes = elem[i].className;
			if (myclass.test(classes)) retnode.push(elem[i]);
		}
		return retnode;
	},
	trim: function(str) {
		var i = 0;
		var whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
		str += ''; 
		var l = str.length;
		for (i = 0; i < l; i++) {       
			if (whitespace.indexOf(str.charAt(i)) === -1) {
				str = str.substring(i);
				break;
			}
		} 
		l = str.length;
		for (i = l - 1; i >= 0; i--) {
			if (whitespace.indexOf(str.charAt(i)) === -1) {
				str = str.substring(0, i + 1);            break;
			}
		} 
		return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
	},
	encodehtml: function(str) {
		str = str.replace(/&/g,'&amp;');
		str = str.replace(/</g,'&lt;');
		str = str.replace(/>/g,'&gt;');
		str = str.replace(/"/g,'&quot;');
		return str;
	},
	closeOpenedCs: function() {
		//if the user forgot to close the Cs, add the cend's and close the divs
		var out = '';
		while (this.openedCs>0) {
			out += '</div><div style="' + this.styles['cend'] + this.styles['yellow'] + '"></div>';
			this.openedCs --;
		}
		return out;
	},
	openedCs: 0,
	config: {
		//these are the default values, they can be overridden by supplying them in the arg object for the parse function
		staticDir: 'http://scratch.mit.edu/ext/blocksplugin/',
		containerClass: 'blocks',
		containerTag: 'pre',
		commentBackground: '#FFFFA5'
	},
	styles: {
		'block_stack':			'position: relative; float: left; clear: both; padding: 3px 5px 3px 5px; cursor: default; -moz-user-select: none; color: #ffffff; border: 1px solid; font: bold 10px Verdana, sans-serif; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px;',
		'block_cstart':			'position: relative; float: left; clear: both; padding: 3px 5px 3px 5px; cursor: default; -moz-user-select: none; color: #ffffff; border: 1px solid; font: bold 10px Verdana, sans-serif; border-radius: 4px 4px 4px 0px; -webkit-border-radius: 4px 4px 4px 0px; -moz-border-radius: 4px 4px 4px 0px;',
		'block_cseparator':		'position: relative; float: left; clear: both; padding: 2px 3px 2px 3px; cursor: default; -moz-user-select: none; color: #ffffff; border: 1px solid; border-left: none; font: bold 10px Verdana, sans-serif; margin-left: -1px; z-index: 2; width: 39px; border-radius: 0 4px 4px 0; -webkit-border-radius: 0 4px 4px 0; -moz-border-radius: 0 4px 4px 0;',
		'cwrap':				'padding: 1px 0 1px 12px; margin: -1px 0 0 0; display: inline-block; position: relative; float: left; clear: both; background-image: url(::config:staticDir::cwrap.png); background-repeat: repeat-y; background-position: left left; z-index: 2;',
		'cend':					'position: relative; height: 7px; width: 50px; margin: -1px 0 0 0; padding: 2px 2px 2px 2px; float: left; clear: both; cursor: default; -moz-user-select: none; color: #ffffff; border-radius: 0px 4px 4px 4px; -webkit-border-radius: 0px 4px 4px 4px; -moz-border-radius: 0px 4px 4px 4px; border: 1px solid;',
		'block_reporter':		'padding: 3px 5px 3px 5px; display: inline-block; cursor: default; -moz-user-select: none; color: #ffffff; border-radius: 30px; -webkit-border-radius: 30px; -moz-border-radius: 30px; border: 1px solid; font: bold 10px Verdana, sans-serif;',
		'block_boolean':		'padding: 3px 5px 3px 5px; display: inline-block; cursor: default; -moz-user-select: none; color: #ffffff; border-radius: 30px; -webkit-border-radius: 30px; -moz-border-radius: 30px; border-style: solid; border-width: 1px; font: bold 10px Verdana, sans-serif;',
		'block_hat':			'position: relative; height: 17px; float: left; clear: both; background-image: url(::config:staticDir::hat_bg.png); background-repeat: no-repeat; padding: 20px 4px 2px 8px; margin-top: 15px; cursor: default; -moz-user-select: none; color: #ffffff; font: bold 10px Verdana, sans-serif; background-color: transparent !important;',
		'hatrightedge':			'width: 3px; height: 28px; padding: 0; float: right; position: relative; top: -9px; right: -5px; background-image: url(::config:staticDir::hat_rightedge.png); background-repeat: no-repeat;',
		'puzzletop':			'position: absolute; left: 9px; top: -1px; clear: both; padding: 0; border: 1px solid #FFFFFF; border-radius: 0px 0px 7px 7px; border-top: none !important; height: 4px; width: 16px; margin: 0 0 0 0; z-index: 3;',
		'puzzlebottom':			'position: absolute; left: 10px; bottom: -5px; clear: both; padding: 0; border: 1px solid #FFFFFF; border-radius: 0px 0px 6px 6px; border-top: none !important; height: 4px; width: 14px; margin: 0 0 0 0; z-index: 4;',
		'icon':					'display: inline-block; vertical-align: bottom; margin: 0 3px 0 3px;',
		'icon_hat':				'display: inline-block; vertical-align: top; margin: -4px 6px 0 6px;',
		'blue':					'background-color: #4A6BD6; border-color: #7394EF #314A94 #314A94 #5273E7;',
		'purple':				'background-color: #8C52E7; border-color: #B584FF #63399C #63399C #9C5AF7;',
		'pink':					'background-color: #CE4ADE; border-color: #EF73F7 #94319C #94319C #E752EF;',
		'green':				'background-color: #00A57B; border-color: #18BD94 #007352 #007352 #00B584;',
		'yellow':				'background-color: #E7AD21; border-color: #FFC642 #A57318 #A57318 #FFB521;',
		'lightblue':			'background-color: #0094DE; border-color: #21ADF7 #00639C #00639C #00A5EF;',
		'lightgreen':			'background-color: #63C610; border-color: #8CEF31 #4A9C08 #4A9C08 #81DB2E;',
		'orange':				'background-color: #F77318; border-color: #FF8C42 #AD5210 #AD5210 #FF7B18;',
		'darkorange':			'background-color: #D94D11; border-color: #D94D11 #98360C #98360C #EB5413;',
		'red':					'background-color: #CC0000; border-color: #E61E1E #8F0000 #8F0000 #DE0000;',
		'puzzle_blue':			'border-color: #7394EF;',
		'puzzle_purple':		'border-color: #B584FF;',
		'puzzle_pink':			'border-color: #EF73F7;',
		'puzzle_green':			'border-color: #18BD94;',
		'puzzle_yellow':		'border-color: #FFC642;',
		'puzzle_lightblue':		'border-color: #21ADF7;',
		'puzzle_lightgreen':	'border-color: #8CEF31;',
		'puzzle_orange':		'border-color: #FF8C42;',
		'puzzle_darkorange':	'border-color: #D94D11;',
		'puzzle_red':			'border-color: #E61E1E;',
		'gap_text':				'display: inline-block; padding: 1px 3px 1px 3px; margin: -1px 1px -1px 1px; height: 12px; font-weight: normal; font-size: 10px; background-color: #FFFFFF; color: #000000; border: 1px solid darkgray;',
		'gap_dropdown':			'display: inline-block; padding: 1px 3px 1px 3px; margin: -1px 0px -1px 0px; height: 12px; font-weight: normal; font-size: 10px; color: #FFFFFF; border: 1px solid darkgray;',
		'gap_number':			'display: inline-block; padding: 1px 3px 1px 3px; margin: -1px 1px -1px 1px; height: 12px; font-weight: normal; font-size: 10px; background-color: #FFFFFF; color: #000000; border: 1px solid #808080; border-bottom: none; border-radius: 6px; -webkit-border-radius: 6px; -moz-border-radius: 6px;',
		'gap_boolean':			'display: inline-block; padding: 1px 3px 1px 3px; margin: -1px 1px -1px 1px; height: 12px; font-weight: normal; font-size: 10px; background-color: #FFFFFF; color: #000000; border: 1px solid; border-radius: 15px; -webkit-border-radius: 15px; -moz-border-radius: 15px; width: 15px;',
		'gap_color':			'display: inline-block; width: 11px; height: 11px; background-color: #FF0000; border: 1px solid #666666; vertical-align: middle;',
		'gapborder_blue':		'border-color: #25366A #92A7E5 #92A7E5 #25366A;',
		'gapborder_purple':		'border-color: #472B71 #BC9AEE #BC9AEE #472B71;',
		'gapborder_pink':		'border-color: #68256C #E392E8 #E392E8 #68256C;',
		'gapborder_green':		'border-color: #007352 #007352 #18BD94 #007352;',
		'gapborder_yellow':		'border-color: #735411 #F0CB7B #F0CB7B #735411;',
		'gapborder_lightblue':	'border-color: #024A6E #69BFEA #69BFEA #024A6E;',
		'gapborder_lightgreen':	'border-color: #316109 #A1DA72 #A1DA72 #316109;',
		'gapborder_orange':		'border-color: #793B0E #D37532 #D37532 #793B0E;',
		'gapborder_darkorange':	'border-color: #6C2608 #E89470 #E89470 #6C2608;',
		'gapborder_red':		'border-color: #8F0000 #E61E1E #E61E1E #8F0000;',
		'dropdownbg_blue':		'background-color: #4B63AB;',
		'dropdownbg_purple':	'background-color: #885DC7;',
		'dropdownbg_pink':		'background-color: #B854C0;',
		'dropdownbg_green':		'',
		'dropdownbg_yellow':	'background-color: #C99B36;',
		'dropdownbg_lightblue':	'background-color: #1A7EB1;',
		'dropdownbg_lightgreen':'background-color: #66AE2B;',
		'dropdownbg_orange':	'background-color: #D37532;',
		'dropdownbg_darkorange':'background-color: #C35428;',
		'dropdownbg_red':		'',
		'commentholder':		'display: inline-block; width: 1px; height: 1px; position: relative; margin-bottom: 4px;',
		'commentline':			'position: absolute; width: 50px; height: 1px; left: 7px; background-color: #888888;',
		'commentbox':			'position: absolute; left: 50px; top: -7px; padding: 3px; background-color: /*#CCCCCC*/#FFFB7A; color: #000000; float: left; clear: right;  border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; font: 10px Verdana; white-space: nowrap;'
	},		
	blocksLib: {
		//MOTION
		'movesteps': ['blue','stack'],
		'turncwdegrees': ['blue','stack'],
		'turnccwdegrees': ['blue','stack'],

		'pointindirection': ['blue','stack'],
		'pointtowards': ['blue','stack'],

		'gotox:y:': ['blue','stack'],
		'goto': ['blue','stack'],
		'glidesecstox:y:': ['blue','stack'],

		'changexby': ['blue','stack'],
		'setxto': ['blue','stack'],
		'changeyby': ['blue','stack'],
		'setyto': ['blue','stack'],

		'ifonedge,bounce': ['blue','stack'],

		'xposition': ['blue','reporter'],
		'yposition': ['blue','reporter'],
		'direction': ['blue','reporter'],
		
		//LOOKS
		'switchtocostume': ['purple','stack'],
		'nextcostume': ['purple','stack'],
		'costume#': ['purple','reporter'],
		'switchtobackground': ['purple','stack'],
		'nextbackground': ['purple','stack'],
		'background#': ['purple','reporter'],

		'sayforsecs': ['purple','stack'],
		'say': ['purple','stack'],
		'thinkforsecs': ['purple','stack'],
		'think': ['purple','stack'],

		'changeeffectby': ['purple','stack'],
		'seteffectto': ['purple','stack'],
		'cleargraphiceffects': ['purple','stack'],

		'changesizeby': ['purple','stack'],
		'setsizeto%': ['purple','stack'],
		'size': ['purple','reporter'],

		'show': ['purple','sftack'],
		'hide': ['purple','stack'],

		'gotofront': ['purple','stack'],
		'gobacklayers': ['purple','stack'],
		
		//SOUND
		'playsound': ['pink','stack'],
		'playsounduntildone': ['pink','stack'],
		'stopallpinks': ['pink','stack'],

		'playdrumforbeats': ['pink','stack'],
		'restforbeats': ['pink','stack'],

		'playnoteforbeats': ['pink','stack'],
		'setinstrumentto': ['pink','stack'],

		'changevolumeby': ['pink','stack'],
		'setvolumeto%': ['pink','stack'],
		'volume': ['pink','reporter'],

		'changetempoby': ['pink','stack'],
		'settempotobpm': ['pink','stack'],
		'tempo': ['pink','reporter'],
		
		//PEN
		'clear': ['green','stack'],

		'pendown': ['green','stack'],
		'penup': ['green','stack'],

		'setpencolorto': ['green','stack'],
		'changepencolorby': ['green','stack'],
		'setpencolorto': ['green','stack'],

		'changepenshadeby': ['green','stack'],
		'setpenshadeto': ['green','stack'],

		'changepensizeby': ['green','stack'],
		'setpensizeto': ['green','stack'],

		'stamp': ['green','stack'],
		
		//CONTROL
		'whenflagclicked': ['yellow','hat'],
		'whenkeypressed': ['yellow','hat'],
		'whenclicked': ['yellow','hat'],

		'waitsecs': ['yellow','stack'],

		'forever': ['yellow','cstart'],
		'repeat': ['yellow','cstart'],
				
		'broadcast': ['yellow','stack'],
		'broadcastandwait': ['yellow','stack'],
		'whenireceive': ['yellow','hat'],
		
		'foreverif': ['yellow','cstart'],
		'if': ['yellow','cstart'],
		'else': ['yellow','cseparator'],
		'waituntil': ['yellow','stack'],
		'repeatuntil': ['yellow','cstart'],
		'end': ['yellow','cend'],

		'stopscript': ['yellow','stack'],
		'stopall': ['yellow','stack'],
		
		//SENSING
		'touching?': ['lightblue','reporter'],
		'touchingcolor?': ['lightblue','reporter'],
		'coloristouching?': ['lightblue','reporter'],
		'askandwait': ['lightblue','stack'],
		'answer': ['lightblue','reporter'],

		'mousex': ['lightblue','reporter'],
		'mousey': ['lightblue','reporter'],
		'mousedown?': ['lightblue','reporter'],

		'keypressed?': ['lightblue','reporter'],

		'distanceto': ['lightblue','reporter'],

		'resettimer': ['lightblue','stack'],
		'timer': ['lightblue','reporter'],

		'of': ['lightblue','reporter'],


		'loudness': ['lightblue','reporter'],
		'loud?': ['lightblue','reporter'],

		//OPERATORS
		'+': ['lightgreen','reporter'],
		'-': ['lightgreen','reporter'],
		'*': ['lightgreen','reporter'],
		'/': ['lightgreen','reporter'],

		'and': ['lightgreen','boolean'],
		'or': ['lightgreen','boolean'],
		'not': ['lightgreen','boolean'],

		'pickrandomto': ['lightgreen','reporter'],

		'=': ['lightgreen','boolean'],
		'&lt;': ['lightgreen','boolean'], // <[] > []>
		'&gt;': ['lightgreen','boolean'], // <[] < []>


		'join': ['lightgreen','reporter'],
		'letterof': ['lightgreen','reporter'],
		'lengthof': ['lightgreen','reporter'],

		'mod': ['lightgreen','reporter'],
		'round': ['lightgreen','reporter'],

		'of': ['lightgreen','reporter'],

		//VARIABLES
		'setto': ['orange','stack'],
		'changeby': ['orange','stack'],
		'showvariable': ['orange','stack'],
		'hidevariable': ['orange','stack'],

		'addto': ['darkorange','stack'],
		'deleteof': ['darkorange','stack'],
		'insertatof': ['darkorange','stack'],
		'replaceitemofwith': ['darkorange','stack'],
		'itemof': ['darkorange','reporter'],
		//'lengthof': ['darkorange','reporter'],
		'contains': ['darkorange','boolean']
	}
}

parse();