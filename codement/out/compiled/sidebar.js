var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* webviews/components/fileList.svelte generated by Svelte v3.35.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (95:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let hr0;
    	let t2;
    	let form0;
    	let label0;
    	let t4;
    	let select0;
    	let t5;
    	let label1;
    	let t7;
    	let input0;
    	let t8;
    	let br0;
    	let t9;
    	let label2;
    	let t11;
    	let input1;
    	let t12;
    	let input2;
    	let t13;
    	let button1;
    	let t15;
    	let hr1;
    	let t16;
    	let br1;
    	let t17;
    	let form1;
    	let label3;
    	let t19;
    	let select1;
    	let t20;
    	let button2;
    	let t22;
    	let button3;
    	let t24;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*results*/ ctx[0];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*results*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*commentList*/ ctx[4] && create_if_block_2(ctx);

    	return {
    		c() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Share File";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			form0 = element("form");
    			label0 = element("label");
    			label0.textContent = "Choose a file to comment:";
    			t4 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Line Number:";
    			t7 = space();
    			input0 = element("input");
    			t8 = space();
    			br0 = element("br");
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Comment:";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Comment";
    			t15 = space();
    			hr1 = element("hr");
    			t16 = space();
    			br1 = element("br");
    			t17 = space();
    			form1 = element("form");
    			label3 = element("label");
    			label3.textContent = "Select a file to load comments:";
    			t19 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t20 = space();
    			button2 = element("button");
    			button2.textContent = "Download";
    			t22 = space();
    			button3 = element("button");
    			button3.textContent = "Load Comment";
    			t24 = space();
    			if (if_block) if_block.c();
    			attr(label0, "for", "result");
    			attr(select0, "name", "result");
    			attr(select0, "id", "result");
    			attr(label1, "for", "line");
    			attr(input0, "type", "text");
    			attr(input0, "name", "line");
    			attr(input0, "id", "line");
    			attr(label2, "for", "comment");
    			attr(input1, "type", "text");
    			attr(input1, "name", "comment");
    			attr(input1, "id", "comment");
    			attr(input2, "type", "hidden");
    			attr(input2, "name", "uname");
    			attr(input2, "id", "uname");
    			input2.value = /*user*/ ctx[2];
    			attr(button1, "type", "submit");
    			attr(label3, "for", "result1");
    			attr(select1, "name", "result1");
    			attr(select1, "id", "result1");
    			attr(button2, "type", "submit");
    			attr(button3, "type", "submit");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button0);
    			append(div, t1);
    			append(div, hr0);
    			append(div, t2);
    			append(div, form0);
    			append(form0, label0);
    			append(form0, t4);
    			append(form0, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			append(form0, t5);
    			append(form0, label1);
    			append(form0, t7);
    			append(form0, input0);
    			append(form0, t8);
    			append(form0, br0);
    			append(form0, t9);
    			append(form0, label2);
    			append(form0, t11);
    			append(form0, input1);
    			append(form0, t12);
    			append(form0, input2);
    			append(form0, t13);
    			append(form0, button1);
    			append(div, t15);
    			append(div, hr1);
    			append(div, t16);
    			append(div, br1);
    			append(div, t17);
    			append(div, form1);
    			append(form1, label3);
    			append(form1, t19);
    			append(form1, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			append(form1, t20);
    			append(form1, button2);
    			append(form1, t22);
    			append(form1, button3);
    			append(div, t24);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler_1*/ ctx[10]),
    					listen(button1, "click", /*commentHandler*/ ctx[6]),
    					listen(button2, "click", /*downloadHandler*/ ctx[7]),
    					listen(button3, "click", /*pullComments*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*results*/ 1) {
    				each_value_2 = /*results*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*user*/ 4) {
    				input2.value = /*user*/ ctx[2];
    			}

    			if (dirty & /*results*/ 1) {
    				each_value_1 = /*results*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*commentList*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (85:20) 
    function create_if_block_1(ctx) {
    	let div;
    	let p;
    	let t1;
    	let hr;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "You currently have no access to any files";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Share File";
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    			append(div, t1);
    			append(div, hr);
    			append(div, t2);
    			append(div, button);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (81:0) {#if !files}
    function create_if_block$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<h1>Loading...</h1>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (106:6) {#each results as result}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*result*/ ctx[17] + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*result*/ ctx[17];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*results*/ 1 && t_value !== (t_value = /*result*/ ctx[17] + "")) set_data(t, t_value);

    			if (dirty & /*results*/ 1 && option_value_value !== (option_value_value = /*result*/ ctx[17])) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (128:8) {#each results as result}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*result*/ ctx[17] + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*result*/ ctx[17];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*results*/ 1 && t_value !== (t_value = /*result*/ ctx[17] + "")) set_data(t, t_value);

    			if (dirty & /*results*/ 1 && option_value_value !== (option_value_value = /*result*/ ctx[17])) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (135:6) {#if commentList}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value = /*comments*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*comments*/ 2) {
    				each_value = /*comments*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (136:8) {#each comments as comment}
    function create_each_block(ctx) {
    	let div;
    	let p0;
    	let span0;
    	let t1;
    	let t2_value = /*comment*/ ctx[14].lines + "";
    	let t2;
    	let t3;
    	let p1;
    	let span1;
    	let t5;
    	let t6_value = /*comment*/ ctx[14].description + "";
    	let t6;
    	let t7;
    	let p2;
    	let span2;
    	let t9_value = /*comment*/ ctx[14].createdAt + "";
    	let t9;
    	let t10;
    	let p3;
    	let span3;
    	let t12;
    	let t13_value = /*comment*/ ctx[14].createdBy + "";
    	let t13;
    	let t14;
    	let br;

    	return {
    		c() {
    			div = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Line:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			span1 = element("span");
    			span1.textContent = "Description:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			span2 = element("span");
    			span2.textContent = "Created At:";
    			t9 = text(t9_value);
    			t10 = space();
    			p3 = element("p");
    			span3 = element("span");
    			span3.textContent = "Created By:";
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			br = element("br");
    			set_style(span0, "color", "#add8e6");
    			set_style(span1, "color", "green");
    			set_style(span2, "color", "green");
    			set_style(span3, "color", "green");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p0);
    			append(p0, span0);
    			append(p0, t1);
    			append(p0, t2);
    			append(div, t3);
    			append(div, p1);
    			append(p1, span1);
    			append(p1, t5);
    			append(p1, t6);
    			append(div, t7);
    			append(div, p2);
    			append(p2, span2);
    			append(p2, t9);
    			append(div, t10);
    			append(div, p3);
    			append(p3, span3);
    			append(p3, t12);
    			append(p3, t13);
    			insert(target, t14, anchor);
    			insert(target, br, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*comments*/ 2 && t2_value !== (t2_value = /*comment*/ ctx[14].lines + "")) set_data(t2, t2_value);
    			if (dirty & /*comments*/ 2 && t6_value !== (t6_value = /*comment*/ ctx[14].description + "")) set_data(t6, t6_value);
    			if (dirty & /*comments*/ 2 && t9_value !== (t9_value = /*comment*/ ctx[14].createdAt + "")) set_data(t9, t9_value);
    			if (dirty & /*comments*/ 2 && t13_value !== (t13_value = /*comment*/ ctx[14].createdBy + "")) set_data(t13, t13_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching) detach(t14);
    			if (detaching) detach(br);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*files*/ ctx[3]) return create_if_block$1;
    		if (!/*results*/ ctx[0]) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let files;
    	let commentList;
    	let { session } = $$props;
    	let results;
    	let comments;
    	let user;
    	session.account.label;

    	onMount(async () => {
    		$$invalidate(2, user = session.account.label);
    		const response = await fetch(`http://localhost:8000/list/file?uname=${user}`);
    		$$invalidate(3, files = await response.json());
    		console.log(files.files);

    		if (files.files.length !== 0) {
    			$$invalidate(0, results = files.files);
    		}
    	});

    	const pullComments = async () => {
    		console.log("commeemlad");
    		let filename = document.getElementById("result1").value;
    		const response = await fetch(`http://localhost:8000/comment?filename=${filename}`);
    		$$invalidate(4, commentList = await response.json());
    		$$invalidate(1, comments = commentList.comments);
    	};

    	const commentHandler = async () => {
    		let filename = document.getElementById("result").value;
    		let line = document.getElementById("line").value;
    		let uname = document.getElementById("uname").value;
    		let comment = document.getElementById("comment").value;
    		console.log("Uname", uname);
    		var details = { uname, filename, line, comment };
    		var formBody = [];

    		for (var property in details) {
    			var encodedKey = encodeURIComponent(property);
    			var encodedValue = encodeURIComponent(details[property]);
    			formBody.push(encodedKey + "=" + encodedValue);
    		}

    		formBody = formBody.join("&");

    		await fetch("http://localhost:8000/comment", {
    			method: "POST",
    			headers: {
    				"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
    			},
    			body: formBody
    		});
    	};

    	const downloadHandler = () => {
    		let fl = document.getElementById("result1").value;
    		ext_vscode.postMessage({ type: "download", value: fl });
    	};

    	const click_handler = () => {
    		ext_vscode.postMessage({ type: "upload", value: "success" });
    	};

    	const click_handler_1 = () => {
    		ext_vscode.postMessage({ type: "upload", value: "success" });
    	};

    	$$self.$$set = $$props => {
    		if ("session" in $$props) $$invalidate(8, session = $$props.session);
    	};

    	$$invalidate(3, files = null);
    	$$invalidate(4, commentList = null);

    	return [
    		results,
    		comments,
    		user,
    		files,
    		commentList,
    		pullComments,
    		commentHandler,
    		downloadHandler,
    		session,
    		click_handler,
    		click_handler_1
    	];
    }

    class FileList extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { session: 8 });
    	}
    }

    /* webviews/components/sidebar.svelte generated by Svelte v3.35.0 */

    function create_else_block(ctx) {
    	let filelist;
    	let current;
    	filelist = new FileList({ props: { session: /*session*/ ctx[0] } });

    	return {
    		c() {
    			create_component(filelist.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(filelist, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const filelist_changes = {};
    			if (dirty & /*session*/ 1) filelist_changes.session = /*session*/ ctx[0];
    			filelist.$set(filelist_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(filelist.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(filelist.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(filelist, detaching);
    		}
    	};
    }

    // (41:0) {#if !session}
    function create_if_block(ctx) {
    	let div;
    	let p;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Sign in with GitHub to get started.";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Sign in with GitHub";
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    			append(div, t1);
    			append(div, button);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*session*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let session;

    	window.addEventListener("message", async event => {
    		const message = event.data;

    		switch (message.command) {
    			case "authComplete":
    				var details = {
    					"uname": message.payload.session.account.label
    				};
    				var formBody = [];
    				for (var property in details) {
    					var encodedKey = encodeURIComponent(property);
    					var encodedValue = encodeURIComponent(details[property]);
    					formBody.push(encodedKey + "=" + encodedValue);
    				}
    				formBody = formBody.join("&");
    				await fetch("http://localhost:8000/user/log", {
    					method: "POST",
    					headers: {
    						"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
    					},
    					body: formBody
    				});
    				$$invalidate(0, session = message.payload.session);
    				console.log(session);
    				break;
    		}
    	});

    	// send message as soon as sidebar loads.
    	ext_vscode.postMessage({ type: "onSignIn", value: "success" });

    	const click_handler = () => {
    		//send message to SidebarProvider.ts
    		global.ext_vscode.postMessage({ type: "onSignIn", value: "success" });
    	};

    	$$invalidate(0, session = null);
    	return [session, click_handler];
    }

    class Sidebar extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new Sidebar({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=sidebar.js.map
