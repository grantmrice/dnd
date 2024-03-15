dnd = {
	crafting: {
		craft: (items, mods, name)=>{
			if(!items){
				items = prompt("Items: Price/Level, XdY[type], ac[+/-]X, chX, hit[+/-]X, dmg[+/-]X, luck[+/-]X").trim();
				mods = prompt("Mods: [Price]/Level").trim();
			}else{
				items = items.trim();
			}
			console.log(items);
			
			var result = {};
			if(mods){
				console.log(mods);
				mods = mods.trim().split(" ");
				
				// split the mods into level 1 chunks and merge those individually
				var modRecipe = "";
				for(var iMod = 0; iMod < mods.length; iMod++){
					var mod = mods[iMod];
					var level = mod.match(/(?<![a-z\+\-\d])\d+(?![a-z\/\d])/gm)[0];
					mod = mod.replace(/(?<![a-z\+\-\d])\d+(?![a-z\/\d])/gm, 1);
					for(var i = 0; i < level; i++){
						modRecipe += " " + mod;
					}
				}
				
				// combine the mods with the regular items
				var modResult = dnd.crafting.merge(modRecipe);
				result = dnd.crafting.merge(dnd.crafting.merge(items).item +" "+ modResult.item);
				result.craftingPrice += modResult.craftingPrice;
				result.time += modResult.time;
			} else {
				result = dnd.crafting.merge(items);
			}
			
			// print results
			dnd.crafting.printCraftingOutput();
			if(name){
				// save item to database
				dnd.crafting.items[name] = result.item;
				console.log(result.item + " saved as " + name);
			}
			
			return result;
		},
		disassemble: (item)=>{
			var components = [];
			item = item.toUpperCase();
			for(argString of item.trim().split(",")){
				var mods = [];
				argString = argString.toUpperCase();
				if(argString.match(/^\d+\-\d+$/)){ // [number]-[number]
					// price-level - unused?
					continue;
				}else if(argString.match(/^\d+$/)){ // [number]
					// level - unused
					continue;
				}else if(argString.match(/^AC\d*[\+\-]?\d+$/)){ // ac(number)(+/-[number])
					if(argString.match(/[\+\-]/)){
						// AC modifier
						var target = Number(argString.match(/[\+\-]\d+/));
						var getValue = (result)=>result.dac;
						var getUnit = ()=>Math.sign(target);
						var getArgText = (mod)=> "ac" + (mod.value > 0? "+" : "") + mod.value;
						mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
						console.log("dac", mods);
					}else if(argString.match(/AC\d+/)){
						// AC
						var target = Number(argString.match(/\d+/)) - 10;
						var getValue = (result)=>result.ac - 10;
						var getUnit = ()=>Math.sign(target);
						var getArgText = (mod)=> "ac" + (Number(mod.value) + 10);
						mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
						console.log("ac", mods);
					}
				}else if(argString.match(/^[\+\-]?\d+\/[\+\-]?\d+$/)){ // (+/-)[number] / (+\-)[number]
					if(argString.match(/[\+\-]/)){
						// break point modifier
						
						// break point min - no calculations needed
						var bpMin = Number(argString.match(/[\+\-]?\d+/));
						
						// break point max
						var target = Number(argString.match(/[\+\-]?\d+$/));
						var getValue = (result)=>result.breakPointMax;
						var getUnit = ()=>Math.sign(target);
						var getArgText = (mod)=> {
							if(!mod.bpMin) mod.bpMin = 0;
							return mod.bpMin + "/" + (mod.value > 0? "+" : "") + mod.value;
						}
						mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
						
						// combine values
						var avgBPMin = Math.floor(bpMin / mods.length);
						var best;
						var hiScore = 0;
						for(mod of mods){
							bpMin -= avgBPMin;
							mod.bpMin = avgBPMin;
							if(Math.abs(mod.value) > hiScore){
								best = mod;
								hiScore = Math.abs(mod.value);
							}
						}
						if(bpMin){
							best.bpMin += bpMin;
						}
						console.log("dBP", mods);
					}else{
						// break points - no calculations needed
						components.push(argString);
					}
				}else if(argString.match(/^HIT[\+\-]?\d+$/)){ // hit(+/-)[number]
					// hit modifier
					var target = Number(argString.match(/[\+\-]?\d+/));
					var getValue = (result)=>result.hit;
					var getUnit = ()=>Math.sign(target);
					var getArgText = (mod)=> "hit" + (mod.value > 0? "+" : "") + mod.value;
					mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
					console.log("hit", mods);
				}else if(argString.match(/^DMG[\+\-]?\d+$/)){ // dmg(+/-)[number]
					// dmg modifier
					var target = Number(argString.match(/[\+\-]?\d+/));
					var getValue = (result)=>result.ddmg;
					var getUnit = ()=>Math.sign(target);
					var getArgText = (mod)=> "dmg" + (mod.value > 0? "+" : "") + mod.value;
					mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
					console.log("dmg", mods);
				}else if(argString.match(/^LUCK[\+\-]?\d+$/)){ // luck(+/-)[number]
					// luck save modifier
					var target = Number(argString.match(/[\+\-]?\d+/));
					var getValue = (result)=>result.luck;
					var getUnit = ()=>Math.sign(target);
					var getArgText = (mod)=> "luck" + (mod.value > 0? "+" : "") + mod.value;
					mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
					console.log("luck", mods);
				}else if(argString.match(/^CH\d+$/)){ // ch[number]
					// chargStringes
					var target = Number(argString.match(/\d+/));
					var getValue = (result)=>result.chargStringes;
					var getUnit = ()=>1;
					var getArgText = (mod)=> "ch" + mod.value;
					mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
					console.log("ch", mods);
				}else if(argString.match(/^\d+D\d+[A-Z]*$/)){ // [dice]d[size](TYPE)
					// damage
					var argStringDice = Number(argString.match(/\d+/));
					var argStringDieSize = Number(argString.match(/(?<=D)\d+/));
					var avgDamage = argStringDice * (argStringDieSize/2 + .5);
					var type = argString.match(/[A-Z]*$/);
					
					// autocorrect with default damage types
					var defaultTypes = ["bludgeoning", "piercing", "slashing", "fire", "cold", "poison", "acid", "necrotic", "radiant", "force", "psychic", "lightning", "thunder", "cosmic"];
					for(defaultType of defaultTypes){
						if(type[0] && !defaultType.toUpperCase().indexOf(type)){
							type = defaultType;
							break;
						}
					}
					
					// optimize for average damage, smallest dice first, i've tried variations
					var target = avgDamage;
					var getValue = (result)=>{
						var dice = result.damage.match(/\d+d\d+/)[0];
						var nDice = dice.match(/\d+/);
						var dieSize = dice.match(/\d+$/);
						return nDice * (dieSize / 2 + .5);
					};
					var getUnit = ()=>2.5;
					var getArgText = (mod)=>{
						for(dieSize of [4,6,8,10,12,20,100]){
							if((mod.value / (dieSize/2 + .5)) % 1 == 0){
								return (mod.value / (dieSize/2 + .5)) + "d" + dieSize;
							}
						}
					}
					mods = dnd.crafting.disassembleMod(target, getValue, getUnit, getArgText);
					console.log("dmg", mods);
					
				}else{
					// tags - no caluclations necessary, may have duplicates
				}
				
				if(mods.length){
					for(mod of mods){
						for(var i = 0; i < mod.count; i++){
							components.push(getArgText(mod));
						}
					}
				}else{
					components.push(argString.toLowerCase());
				}
			}
			
			return components;
		},
		disassembleMod: (target, getValue, getUnit, getArgText)=>{
			var bestAttempt;
			var preview;
			var solutions = [];
			var mods = [{
				value: getUnit(),
				count: 1,
				level: 1
			}];
			while(true){
				var index = mods.length - 1;
				var value = undefined;
				for(var i = 1; i < 1000; i++){ // this loop will change - exit when done?
					// create the item string for the merge function
					var testItem = "";
					for(mod of mods){
						for(var n = 0; n < mod.count; n++){
							testItem += " " + mod.level + "," + getArgText(mod);
						}
					}
					//console.log("testing", testItem);
					
					// test the given values
					preview = dnd.crafting.merge(testItem);
					value = getValue(preview.result);
					//console.log(preview.item, value, JSON.parse(JSON.stringify(preview)));
					
					if(value == target){ // success
						solutions.push(preview);
						break;
					}else if(Math.abs(value) > Math.abs(target)){ // overshot, needs smaller mods
						mods[index].count--;
						index--;
					}else if(index == mods.length - 1 && Math.abs(value) > Math.abs(mods[index].value)){ // append new, higher mod, but don't use it yet
					//console.log(JSON.parse(JSON.stringify(preview)));
						mods.push({
							value: value,
							count: 0,
							level: preview.result.level
						});
					}
					
					if(index < 0) break;
					mods[index].count++;
				}
				
				// break the loop if the solutions aren't improving
				if(bestAttempt && preview.recipe.length == bestAttempt.recipe.length && preview.result.level && bestAttempt.result.level){
					solutions.pop();
					break;
				}else{
					bestAttempt = preview;
					bestAttempt.mods = JSON.parse(JSON.stringify(mods));
				}
				
				// prep the mods list for the next iteration, using the new, higher mod
				for(mod of mods){
					mod.count = 0;
				}
				mods[mods.length - 1].count = 1;
				//console.log(mods)
			}
			
			// score solutions, return the highest level/material ratio
			//console.log(solutions);
			var bestSolution = {mods: []};
			var hiScore = 0;
			for(solution of solutions){
				var score = solution.result.level / solution.recipe.length;
				if(score > hiScore){
					bestSolution = solution;
					hiScore = score;
				}
			}
			
			// format solution
			var result = [];
			for(mod of bestSolution.mods){
				if(mod.count){
					result.push(mod);
				}
			}
			return result;
		},
		getDamageDice: (avgDamage)=>{
			// get dice rolls for each main damage type
			var resultDice;
			var resultDieSize;
			var dieSizes = [4, 6, 8, 10, 12, 20, 100];
			
			// find a die size/count that most closely matches what the average damage should be
			for(dieSize of dieSizes){
				if(dieSize * dieSize > avgDamage){ // enforce a minimum size
					var dice = Math.round(avgDamage / (dieSize/2 + .5));
					var difference = Math.abs(avgDamage - ((dieSize/2 + .5) * dice));
					if(resultDieSize){
						if(difference <= Math.abs(avgDamage - (resultDice * (resultDieSize/2 + .5)))){
							resultDice = dice;
							resultDieSize = dieSize;
						}
					}else{
						resultDice = dice;
						resultDieSize = dieSize;
					}
				}
			}
			
			return resultDice + "d" + resultDieSize;
		},
		initializeParameters: ()=>{
			dnd.crafting.parameters = {
				damage: false,
				ac: false,
				dac: false,
				charges: false,
				breakPoints: false,
				dBreakPoint: false,
				hit: false,
				ddmg: false,
				luck: false,
				mods: 0,
				items: 0,
				hitItems: 0,
				chargeItems: 0,
				breakPointItems: 0,
				dBreakPointItems: 0,
				acItems: 0,
				dacItems: 0,
				dmgItems: 0,
				ddmgItems: 0,
				luckItems: 0,
				ingredients: 0,
				physicalDamageType: "",
				magicalDamageType: ""
			};
		},
		items: {},
		getIngredient: (itemText)=>{ // get ingredient object from item string
			var ingredient = {
				ac: 0,
				dac: 0,
				charges: 0,
				damage: {},
				dDamage: 0,
				breakPoints: 0,
				breakPointMax: 0,
				dBreakPoint: 0,
				dBreakPointMax: 0,
				luck: 0,
				dieSize: 100,
				hit: 0,
				level: 0,
				price: 0,
				truePrice: 0,
				type: "",
				hasDamage: false,
				tags: {}
			};
			for(arg of item.trim().split(",")){
				arg = arg.toUpperCase();
				if(arg.match(/^\d+\-\d+$/)){ // [number]-[number]
					// price-level
					var iSlash = arg.indexOf("-");
					ingredient.level = Number(arg.substr(iSlash + 1));
					ingredient.price = Number(arg.substring(0, iSlash) / ingredient.level);
					ingredient.truePrice = Number(arg.substring(0, iSlash));
					ingredient.type = "ITEM";
					dnd.crafting.parameters.items++;
				}else if(arg.match(/^\d+$/)){ // [number]
					// level
					ingredient.level = Number(arg);
					dnd.crafting.parameters.mods++;
					ingredient.type = "MOD";
				}else if(arg.match(/^AC\d*[\+\-]?\d+$/)){ // ac(number)(+/-[number])
					if(arg.match(/[\+\-]/)){
						// AC modifier
						ingredient.dac = Number(arg.match(/[\+\-]\d+/));
						dnd.crafting.parameters.dac = true;
						dnd.crafting.parameters.acItems++;
						dnd.crafting.parameters.dacItems++;
					}
					if(arg.match(/AC\d+/)){
						// AC
						ingredient.ac = arg.match(/\d+/) - 10;
						dnd.crafting.parameters.ac = true;
						dnd.crafting.parameters.acItems++;
					}
				}else if(arg.match(/^[\+\-]?\d+\/[\+\-]?\d+$/)){ // bp(+/-)[number] / [number]
					if(arg.match(/[\+\-]/)){
						// break point modifier
						ingredient.dBreakPoint = Number(arg.match(/[\+\-]?\d+/));
						ingredient.dBreakPointMax = Number(arg.match(/[\+\-]?\d+$/));
						dnd.crafting.parameters.dBreakPoints = true;
						dnd.crafting.parameters.dBreakPointItems++;
					}else{
						// break points
						ingredient.breakPoints = Number(arg.match(/\d+/));
						ingredient.breakPointMax = Number(arg.match(/\d+$/));
					}
					
					dnd.crafting.parameters.breakPoints = true;
					dnd.crafting.parameters.breakPointItems++;
				}else if(arg.match(/^HIT[\+\-]?\d+$/)){ // hit(+/-)[number]
					// hit modifier
					ingredient.hit = Number(arg.substr(3));
					dnd.crafting.parameters.hit = true;
					dnd.crafting.parameters.hitItems++;
				}else if(arg.match(/^DMG[\+\-]?\d+$/)){ // dmg(+/-)[number]
					// dmg modifier
					ingredient.dDamage = Number(arg.substr(3));
					dnd.crafting.parameters.ddmg = true;
					dnd.crafting.parameters.ddmgItems++;
				}else if(arg.match(/^LUCK[\+\-]?\d+$/)){ // luck(+/-)[number]
					// luck save modifier
					ingredient.luck = Number(arg.substr(4));
					dnd.crafting.parameters.luck = true;
					dnd.crafting.parameters.luckItems++;
				}else if(arg.match(/^CH\d+$/)){ // ch[number]
					// charges
					ingredient.charges = Number(arg.substr(2));
					dnd.crafting.parameters.charges = true;
					dnd.crafting.parameters.chargeItems++;
				}else if(arg.match(/^\d+D\d+[A-Z]*$/)){ // [dice]d[size](TYPE)
					// damage
					var dice = Number(arg.match(/\d+/));
					var dieSize = Number(arg.match(/(?<=D)\d+/));
					var avgDamage = dice * (dieSize/2 + .5);
					var type = arg.match(/[A-Z]*$/);
					
					// autocorrect with default damage types
					var defaultTypes = ["bludgeoning", "piercing", "slashing", "fire", "cold", "poison", "acid", "necrotic", "radiant", "force", "psychic", "lightning", "thunder", "cosmic"];
					for(defaultType of defaultTypes){
						if(type[0] && !defaultType.toUpperCase().indexOf(type)){
							type = defaultType;
							break;
						}
					}
					
					if(ingredient.damage[type]){
						ingredient.damage[type].dieSize = Math.min(ingredient.damage[type].dieSize, dieSize);
						ingredient.damage[type].avgDamage += avgDamage;
					}else{
						ingredient.damage[type] = {
							type: type,
							dieSize: dieSize,
							avgDamage: avgDamage
						};
					}
					dnd.crafting.parameters.damage = true;
					ingredient.hasDamage = true;
				}else{
					// tags
					ingredient.tags[arg] = arg;
				}
			}
			//console.log(ingredient.level);
			if(ingredient.hasDamage){
				dnd.crafting.parameters.dmgItems++;
			}
			
			dnd.crafting.parameters.ingredients++;
			
			return ingredient;
		},
		getOutput: (recipe)=>{ // create output message
			var output = {
				recipe: recipe
			};
			
			if(dnd.crafting.parameters.damage){
				output.damage = dnd.crafting.result.damage;
			}
			
			if(dnd.crafting.parameters.hit){
				output.hit = "Hit: " + (dnd.crafting.result.hit < 0? "" : "+") + dnd.crafting.result.hit + "\n";
			}
			
			if(dnd.crafting.parameters.ac){
				if(dnd.crafting.parameters.dac){
					output.ac = "AC: " + (dnd.crafting.result.ac + dnd.crafting.result.dac) + "\n";
				}else{
					output.ac = "AC: " + dnd.crafting.result.ac + "\n";
				}
			}else if(dnd.crafting.parameters.dac){
				output.ac = "AC: " + (dnd.crafting.result.dac < 0? "" : "+") + dnd.crafting.result.dac + "\n"
			}
			
			if(dnd.crafting.parameters.charges){
				output.charges = "Charges: " + dnd.crafting.result.charges + "\n";
			}
			
			if(dnd.crafting.parameters.luck){
				output.luck = "Luck: " + dnd.crafting.result.luck + "\n";
			}
			
			if(dnd.crafting.result.tags){
				output.tags = "";
				for(tag of dnd.crafting.result.tags){
					output.tags += "," + tag;
				}
				output.tags = output.tags.substr(1);
			}
			
			if(dnd.crafting.parameters.breakPoints){
				output.breakPoints = "Break Points: " + dnd.crafting.result.breakPoints + "/" + dnd.crafting.result.breakPointMax + "\n";
			}
			
			output.truePrice = dnd.crafting.result.truePrice;
			output.level = "Level: " + dnd.crafting.result.level + "\n";
			output.craftingPrice = dnd.crafting.result.craftingPrice;
			output.time = dnd.crafting.result.time;
			
			// output crafting string
			var resultString = "";
			resultString += (Math.round(dnd.crafting.result.truePrice) + "-" + dnd.crafting.result.level).replace(/^0\-/, "");
			resultString += dnd.crafting.result.physicalDamageType? "," + dnd.crafting.getDamageDice(dnd.crafting.result.physicalDamageType.avgDamage) + dnd.crafting.result.physicalDamageType.type : "";
			resultString += dnd.crafting.result.magicalDamageType && dnd.crafting.result.magicalDamageType.type? "," + dnd.crafting.getDamageDice(dnd.crafting.result.magicalDamageType.avgDamage) + dnd.crafting.result.magicalDamageType.type : "";
			resultString += dnd.crafting.parameters.ddmg? ",dmg" + (dnd.crafting.result.ddmg < 0? "" : "+") + dnd.crafting.result.ddmg : "";
			resultString += dnd.crafting.parameters.hit? ",hit" + (dnd.crafting.result.hit < 0? "" : "+") + dnd.crafting.result.hit : "";
			if(dnd.crafting.parameters.ac){
				if(dnd.crafting.parameters.dac){
					resultString += ",ac" + (dnd.crafting.result.ac + dnd.crafting.result.dac);
				}else{
					resultString += ",ac" + dnd.crafting.result.ac;
				}
			}else if(dnd.crafting.parameters.dac){
				resultString += ",ac" + (dnd.crafting.result.dac < 0? "" : "+") + dnd.crafting.result.dac;
			}
			resultString += dnd.crafting.parameters.charges? ",ch" + dnd.crafting.result.charges : "";
			resultString += dnd.crafting.parameters.luck? ",luck" + dnd.crafting.result.luck : "";
			resultString += output.tags? "," + output.tags : "";
			resultString += dnd.crafting.parameters.breakPoints? "," + dnd.crafting.result.breakPoints + "/" + dnd.crafting.result.breakPointMax : "";
			output.item = resultString;
			output.result = dnd.crafting.result;
			output.sum = dnd.crafting.sum;
			output.parameters = dnd.crafting.parameters;
			
			dnd.crafting.output = output;
			return output;
		},
		getResult: (recipe)=>{ // calculate result parameters
			var result = {
				// (average AC) * (reduce if not focused on AC) * (increase if focused on AC)
				ac: Math.round((dnd.crafting.sum.ac / dnd.crafting.parameters.acItems) * Math.min(Math.sqrt((dnd.crafting.parameters.acItems) / dnd.crafting.parameters.ingredients), 1) * Math.sqrt(dnd.crafting.parameters.acItems)),
				// (average dAC) * (increase if focused on AC)
				dac: Math.round((dnd.crafting.sum.dac / dnd.crafting.parameters.dacItems) * Math.sqrt(dnd.crafting.parameters.dacItems)),
				// (average hit) * (increase if focused on hit)
				hit: Math.round((dnd.crafting.sum.hit / dnd.crafting.parameters.hitItems) * Math.sqrt(dnd.crafting.parameters.hitItems)),
				// (average dDamage) * (increase if focused on dDamage)
				ddmg: Math.round((dnd.crafting.sum.ddmg / dnd.crafting.parameters.ddmgItems) * Math.sqrt(dnd.crafting.parameters.ddmgItems)),
				// (average # of charges) * (increase if focused on charges)
				charges: Math.round((dnd.crafting.sum.charges / dnd.crafting.parameters.chargeItems) * Math.sqrt(dnd.crafting.parameters.chargeItems) - (Math.sqrt(dnd.crafting.sum.maxCharges) - Math.sqrt(dnd.crafting.sum.minCharges))),
				// (average luck) * (increase if focused on luck)
				luck: Math.round((dnd.crafting.sum.luck / dnd.crafting.parameters.luckItems) * Math.sqrt(dnd.crafting.parameters.luckItems)),
				// tend toward the highest value (least stable component)
				breakPoints: Math.round(dnd.crafting.sum.breakPointPowerSum / Math.max(dnd.crafting.sum.breakPointSum, 1) + dnd.crafting.sum.dBreakPoint),
				// tend toward higest value (most durable component)
				breakPointMax: Math.round(dnd.crafting.sum.breakPointMaxPowerSum / Math.max(dnd.crafting.sum.breakPointMax, 1) + dnd.crafting.sum.dBreakPointMax + Math.sign(dnd.crafting.parameters.dBreakPointItems - 1) * Math.max(Math.sqrt(dnd.crafting.sum.dBreakPointMax) / dnd.crafting.parameters.dBreakPointItems - 1, 0)),
				level: dnd.crafting.sum.level,
				truePrice: dnd.crafting.sum.truePrice + (dnd.crafting.sum.truePrice / Math.max(dnd.crafting.sum.itemLevel, 1)) * Math.sqrt(dnd.crafting.sum.level + Math.sqrt(dnd.crafting.sum.level) / Math.max(dnd.crafting.parameters.items, 1)),
				damage: [],
				tags: []
			};
			result.ac += 10;
			// (increase per average price of ingredients) * (increase per number of ingredients) * (increase per average level)
			result.craftingPrice = Math.sqrt(result.truePrice / dnd.crafting.parameters.ingredients) * Math.sqrt(dnd.crafting.parameters.ingredients) * Math.sqrt(result.level / dnd.crafting.parameters.ingredients);
			// (increase by crafting price) * (increase by level of ingredients) * (increase by number of ingredients)
			result.time = Math.sqrt(Math.max(Math.sqrt(result.craftingPrice), dnd.crafting.parameters.ingredients) * Math.sqrt(result.level) * Math.sqrt(dnd.crafting.parameters.ingredients));
			//  longer jobs cost more, (how long the crafting takes) * (increase hourly rate for larger projects)
			result.craftingPrice *= result.time;
			result.truePrice = dnd.crafting.sum.truePrice + result.craftingPrice + Math.sqrt(result.craftingPrice);
			result.time -= Math.sqrt(result.time);
			
			for(tag in dnd.crafting.sum.tags){
				result.tags.push(tag);
			}
			
			// no changes when there's only one item
			if(recipe.length == 1){
				result.truePrice = dnd.crafting.sum.truePrice;
				result.craftingPrice = 0;
				result.time = 0;
			}
			//console.log("result", result);
			
			if(dnd.crafting.parameters.damage){
				// add max damage and min die size for each type to result
				for(sumDamageType in dnd.crafting.sum.damage){
					var damageType = dnd.crafting.sum.damage[sumDamageType];
					result.damage.push({
						type: sumDamageType,
						dieSize: damageType.dieSize,
						// (average damage for this type) * (reduce if not focused on damage) * (increase by number of ingredients of this type)
						avgDamage: (damageType.avgDamage / damageType.count) * Math.min(Math.sqrt((dnd.crafting.parameters.dmgItems + dnd.crafting.parameters.ddmgItems) / dnd.crafting.parameters.ingredients), 1) * Math.sqrt(damageType.count),
					});
				}
				
				// get total dnd.crafting.sum of max damages
				var totalPhysicalDamage = 0;
				var totalMagicalDamage = 0;
				for(damageType of result.damage){
					if(damageType.type.indexOf("bl") && damageType.type.indexOf("sl") && damageType.type.indexOf("pi")){
						totalMagicalDamage += damageType.avgDamage;
					}else{
						totalPhysicalDamage += damageType.avgDamage;
					}
				}
				
				// identify the main damage types
				if(!dnd.crafting.parameters.physicalDamageType){
					var hiScore = 0;
					for(damageType of result.damage){
						if(damageType.avgDamage > hiScore && !(damageType.type.indexOf("bl") && damageType.type.indexOf("sl") && damageType.type.indexOf("pi"))){
							hiScore = damageType.avgDamage;
							dnd.crafting.parameters.physicalDamageType = damageType.type;
						}
					}
				}
				if(!dnd.crafting.parameters.magicalDamageType){
					var hiScore = 0;
					for(damageType of result.damage){
						if(damageType.avgDamage > hiScore && damageType.type.indexOf("bl") && damageType.type.indexOf("sl") && damageType.type.indexOf("pi")){
							hiScore = damageType.avgDamage;
							dnd.crafting.parameters.magicalDamageType = damageType.type;
						}
					}
				}
				
				// get the ratio of the main damage type
				var physicalDamageRatio;
				var magicalDamageRatio;
				var physicalDamageType;
				var magicalDamageType;
				for(damageType of result.damage){
					if(damageType.type == dnd.crafting.parameters.physicalDamageType){
						physicalDamageRatio = Math.sqrt(damageType.avgDamage / totalPhysicalDamage);
						physicalDamageType = damageType;
					}
					if(damageType.type == dnd.crafting.parameters.magicalDamageType){
						magicalDamageRatio = Math.sqrt(damageType.avgDamage / totalMagicalDamage);
						magicalDamageType = damageType;
					}
				}
				
				// collect damage from the non-main damage types
				var shiftingPhysicalDamage = 0;
				var shiftingMagicalDamage = 0;
				for(damageType of result.damage){
					if(damageType == physicalDamageType || damageType == magicalDamageType) continue;
					if(damageType.type.indexOf("bl") && damageType.type.indexOf("sl") && damageType.type.indexOf("pi")){
						shiftingMagicalDamage += damageType.avgDamage * magicalDamageRatio;
					}else{
						shiftingPhysicalDamage += damageType.avgDamage * physicalDamageRatio;
					}
				}
				
				// shift the collected damage to the main damage type
				if(physicalDamageType){
					physicalDamageType.avgDamage += shiftingPhysicalDamage;
				}
				if(magicalDamageType){
					magicalDamageType.avgDamage += shiftingMagicalDamage;
				}
				
				// build damage strings
				var physicalDamageDice = "";
				var magicalDamageDice = "";
				if(physicalDamageType){
					physicalDamageDice = dnd.crafting.getDamageDice(physicalDamageType.avgDamage) + " " + physicalDamageType.type;
				}
				if(magicalDamageType){
					magicalDamageDice = dnd.crafting.getDamageDice(magicalDamageType.avgDamage) + " " + magicalDamageType.type;
				}
				result.damage = "Damage: " + physicalDamageDice + (physicalDamageDice && magicalDamageType && magicalDamageType.type? " + " : "") + (magicalDamageType && magicalDamageType.type? magicalDamageDice : "") + (dnd.crafting.parameters.ddmg? " " + (result.ddmg < 0? "-" : "+") + " " + Math.abs(result.ddmg) : "") + "\n";
			}
			
			result.physicalDamageType = physicalDamageType;
			result.magicalDamageType = magicalDamageType;
			dnd.crafting.result = result;
		},
		getSum: (recipe)=>{ // combine the recipe properties into one object
			var sum = {
				ac: 0,
				dac: 0,
				charges: 0,
				breakPointSum: 0,
				breakPointMax: 0,
				breakPointPowerSum: 0,
				breakPointMaxPowerSum: 0,
				dBreakPoint: 0,
				dBreakPointMax: 0,
				damage: {},
				ddmg: 0,
				luck: 0,
				hit: 0,
				maxCharges: 0,
				minCharges: 10000,
				minDiceSize: 100,
				level: 0,
				price: 0,
				truePrice: 0,
				maxLevel: 0,
				itemLevel: 0,
				tags: {}
			};
			for(ingredient of recipe){
				sum.ac += ingredient.ac;
				sum.dac += ingredient.dac;
				sum.charges += ingredient.charges;
				sum.level += ingredient.level;
				sum.ddmg += ingredient.dDamage;
				sum.luck += ingredient.luck;
				sum.hit += ingredient.hit;
				sum.price += ingredient.price;
				sum.truePrice += ingredient.truePrice;
				sum.breakPointSum += ingredient.breakPoints;
				sum.breakPointMax += ingredient.breakPointMax;
				sum.breakPointPowerSum += ingredient.breakPoints * ingredient.breakPoints;
				sum.breakPointMaxPowerSum += ingredient.breakPointMax * ingredient.breakPointMax;
				sum.dBreakPoint += ingredient.dBreakPoint;
				sum.dBreakPointMax += ingredient.dBreakPointMax;
				
				for(var tag in ingredient.tags){
					sum.tags[tag] = tag;
				}
				
				if(ingredient.charges > sum.maxCharges){
					sum.maxCharges = ingredient.charges;
				}
				if(ingredient.charges < sum.minCharges){
					sum.minCharges = ingredient.charges;
				}
				
				if(ingredient.type == "ITEM"){
					sum.itemLevel += ingredient.level;
				}
				
				if(ingredient.dieSize < sum.minDiceSize){
					sum.minDiceSize = ingredient.dieSize;
				}
				for(ingredientDamageType in ingredient.damage){
					var damageType = ingredient.damage[ingredientDamageType];
					if(sum.damage[damageType.type]){
						sum.damage[damageType.type].dieSize = Math.min(sum.damage[damageType.type].dieSize, damageType.dieSize);
						sum.damage[damageType.type].avgDamage += damageType.avgDamage;
						sum.damage[damageType.type].count++;
					}else{
						sum.damage[damageType.type] = {
							type: damageType.typedamage,
							dieSize: damageType.dieSize,
							avgDamage: damageType.avgDamage,
							count: 1
						}
					}
				}
			}
			
			dnd.crafting.sum = sum;
		},
		merge: (ingredients)=>{ // generate the result object
			dnd.crafting.initializeParameters();
			
			// parse input text to get item dnd.crafting.parameters
			var recipe = [];
			if(ingredients.constructor != Array){
				ingredients = ingredients.trim().split(" ");
			}
			for(item of ingredients){
				recipe.push(dnd.crafting.getIngredient(item));
			}
			
			dnd.crafting.getSum(recipe);
			dnd.crafting.getResult(recipe);
			
			return dnd.crafting.getOutput(recipe);
		},
		output: {},
		parameters: {},
		printCraftingOutput: ()=>{ // duh
			var txt = "";
			txt += dnd.crafting.output.damage? dnd.crafting.output.damage : "";
			txt += dnd.crafting.output.hit? dnd.crafting.output.hit : "";
			txt += dnd.crafting.output.ac? dnd.crafting.output.ac : "";
			txt += dnd.crafting.output.charges? dnd.crafting.output.charges : "";
			txt += dnd.crafting.output.luck? dnd.crafting.output.luck : "";
			txt += dnd.crafting.output.breakPoints? dnd.crafting.output.breakPoints : "";
			txt += dnd.crafting.output.tags? "Tags:\n\t" + dnd.crafting.output.tags.replaceAll(",", "\n\t") + "\n": "";
			txt += txt? "\n" : "";
			txt += "Sale Price: " + Math.round(dnd.crafting.output.truePrice) + "\n";
			txt += dnd.crafting.output.level;
			txt += "Crafting Cost: " + Math.round(dnd.crafting.output.craftingPrice) + "\n";
			txt += "Time: " + Math.round(dnd.crafting.output.time) + " hours";
			console.log(txt);
			console.log(dnd.crafting.output.item);
			//console.log(dnd.crafting.output);
		},
		result: {},
		sum: {}
	},
	rollScraper: {
		getElements: (segments, attempts, iEntry, lastTime, gameLog, gameLogEntries, entries)=>{
			console.log("attempting getElements()", attempts);
			var entryElements = gameLogEntries.children;
			for(;iEntry < entryElements.length - 1; iEntry++){
				var entry = entryElements[iEntry];
				var time = dnd.rollScraper.getTime(entry);
				if(lastTime - time > 24 * 1000 * 3600 && !--segments){
					console.log("Successful search");
					dnd.rollScraper.getRolls(iEntry, entries);
					return;
				}
				lastTime = time;
				entries.push(entry);
			}
			
			if(!attempts) {
				console.log("out of attempts");
				dnd.rollScraper.getRolls(iEntry, entries);
				return;
			}
			
			gameLog.scrollTo(0, -gameLog.scrollHeight);
			setTimeout(dnd.rollScraper.getElements, 500, segments, attempts - 1, iEntry, lastTime, gameLog, gameLogEntries, entries);
		},
		getPlayerName: (characterName)=>{
			var dict = [
				["Tabi Gee", "Anne"],
				["Givin Dramarr", "Tyler"],
				["Brillinn Ironfist", "Rizaldy"],
				["Kaida", "Rizaldy"],
				["Yaufis Bloodfang", "Mary"],
				["Lanvyn Fabblestabble", "Grant"],
				["Yaufis", "Mary"],
				["Umedithas", "Chaim"],
				["Zaegar", "Isaiah"],
				["Taigar", "Isaiah"],
				["Mortal Origin Zaegar", "Isaiah"],
				["Maximo FatherMan", "Aaron"],
				["Inej Mistwalker", "Kimora"],
				["Validon", "Devin"],
				["Hiawatone (The Listening Trees)", "Cymone"],
				["Jade Idaara", "Ashley"],
				["Vorzak Thunderfist", "Alan"],
				["Goldi Thunderfist", "Alan"],
				["Dauron the Defiler", "Anonymous"],
				["Vape", "Curtis"],
				["Evangelo Holysmokes", "Evan"],
				["Gallidir", "Ambi-Grant"],
			];
			
			for(var i = 0; i < dict.length; i++){
				if(characterName == dict[i][0]){
					return dict[i][1];
				}
			}
			
			return "DM-Grant"; // DM name
		},
		getAttribute: (atb1, atb2)=>{
			switch(atb2){
				default:
					return atb1;
				case "save":
					return atb1 + "-SAVE";
				case "check":
					return atb1;
				case "damage":
					return "DMG-" + atb1;
				case "to hit":
					return "HIT-" + atb1;
				case "roll":
					switch(atb1){
						default:
							return atb1;
						case "custom":
							return "MISC";
					}
			}
		},
		getTime: (entry)=>{
			return new Date(entry.getElementsByTagName("time")[0].dateTime);
		},
		format: (roll)=>{
			return roll[0] + "\t" + // character name
				roll[7] + "\t" + // player name
				roll[8] + "\t" + // stat
				roll[12] + "\t" + // final roll
				roll[10] + "\t" + // dice size
				roll[9] + "\t" + // num dice
				roll[11] + "\n"; // modifier
		},
		getRolls: (stopIndex, entries)=>{
			console.log("getting roll data, opening " + stopIndex + " divs")
			var result = []
			var rolls = [];
			console.log("oldest at ", entries[entries.length - 1].getElementsByTagName("time")[0].title);
			for(var i = 0; i < stopIndex; i++){
				if(i%100 == 0) console.log(i);
				// open up the entry element
				var entry = entries[i];
				if(entry.getElementsByTagName("span").length < 6){
					for(resultElement of entry.getElementsByTagName("div")){
						if(resultElement.className.includes("-Result")){
							resultElement.click();
							break;
						}
					}
				}
				
				// get raw data from entry
				var roll = [];
				rolls[i] = roll;
				//console.log(entry.textContent);
				spans = entry.getElementsByTagName("span");
				if(!spans[1]){
					console.log("Bad Entry", entry);
					continue;
				}
				roll.push(spans[0].textContent); // character name
				roll.push(spans[1].textContent); // attribute 1
				roll.push(spans[2].textContent); // attribute 2
				roll.push(spans[4].textContent); // roll info
				roll.push(spans[5].textContent); // roll info to self / final result
				if(spans[6]) roll.push(spans[6].textContent); // final result to self
				roll.push(spans[3].textContent); // roll details
				//console.log(roll[6]);
				
				// parse data from entry
				roll.push(dnd.rollScraper.getPlayerName(roll[0].trim())); // player name
				roll.push(dnd.rollScraper.getAttribute(roll[1], roll[2])); // attribute
				var iRoll = 3;
				var dIndex = roll[iRoll].indexOf("d");
				var toSelf = dIndex < 0;
				if(toSelf){ // if "to self"
					iRoll++;
					dIndex = roll[iRoll].indexOf("d");
				}
				
				roll.push(roll[iRoll].substr(0, dIndex)); // num dice
				var subString = roll[iRoll].substr(dIndex + 1);
				var modIndex = subString.indexOf("k");
				if(modIndex < 0){ // if flat
					modIndex = subString.indexOf("+");
					if(modIndex < 0) modIndex = subString.indexOf("-");
					if(modIndex < 0) modIndex = subString.length;
					roll.push(subString.substr(0, modIndex)); // dice size
					roll.push(subString.substr(modIndex) - 0); // modifier
					roll.push(roll[iRoll + 1]); // final result
					result.push(dnd.rollScraper.format(roll));
				}else{ // if advantage/disadvantage
					var keep = subString.substr(modIndex + 2, 1);
					roll[9] -= keep;
					roll.push(subString.substr(0, modIndex)); // dice size
					modIndex = subString.indexOf("+");
					if(modIndex < 0) modIndex = subString.indexOf("-");
					if(modIndex < 0) modIndex = subString.length;
					iRoll++;
					roll.push(subString.substr(modIndex) - 0); // modifier
					var diceRolls = JSON.parse(roll[toSelf? 3: 6].substring(0, roll[toSelf? 3: 6].indexOf(")") + 1).replace("(", "[").replace(")", "]"));
					for(diceRoll of diceRolls){
						roll[12] = (diceRoll - 0) + roll[11]; // final roll
						result.push(dnd.rollScraper.format(roll));
					}
				}
				//console.log(roll);
			}
			
			console.log("transposing results");
			var output = "";
			for(var i = result.length - 1; i >= 0; i--){
				output += result[i];
			}
			console.log(output);
		}
	},
	scrape: (segments, attempts)=>{
		if(!segments){
			segments = 1;
		}
		if(!attempts){
			attempts = 20;
		}
		
		var gameLog;
		for(div of document.getElementsByTagName("div")){
			if(div.className.includes("GameLog") && !div.className.includes(" ")){
				//console.log(gameLog);
				gameLog = div;
			}
		}

		var gameLogEntries;
		for(ol of document.getElementsByTagName("ol")){
			if(ol.className.includes("GameLogEntries")){
				//console.log(gameLog);
				gameLogEntries = ol;
			}
		}
		
		dnd.rollScraper.getElements(segments, attempts, 0, 0, gameLog, gameLogEntries, []);
	},
	turnOrder: ()=>{
		var result = "";
		for(combatant of document.getElementsByClassName("combatant-card")){
				result += combatant.getElementsByTagName("input")[0].value +" - "+ combatant.getElementsByClassName("combatant-dnd.summary__name")[0].textContent +"\n"
		}
		console.log(result);
	}
}

function createHelpers(){
	
	arsenal = ()=>{
		for(weapon of dnd.weapon.arsenal){
			dnd.weapon.printStats(weapon);
		}
	};
	
	craft = (items, name) => {
		return dnd.crafting.craft(items, "", name);
	};

	getItem = (name) => {
		var itemString = dnd.crafting.items[arguments[0]];
		for(var i = 1; i < arguments.length; i++){
			itemString += " " + dnd.crafting.items[arguments[i]];
		}
		return itemString;
	};
	
	getItems = () => {
		console.log("dnd.crafting.items = JSON.parse(\'" + JSON.stringify(dnd.crafting.items) + "\')");
	};
	
	help = () => {
		console.log("");
	};
	
	recall = (name) => {
		if(!name){
			name = prompt("What is the name of the weapon you're recalling?");
		}
		dnd.weapon.printStats(weapon.arsenal[name]);
		return dnd.crafting.craft(items, "", name);
	};
}

createHelpers();
//dnd.scrape()
//dnd.craft()
