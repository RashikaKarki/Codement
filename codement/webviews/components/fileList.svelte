<script>
  import { onMount } from "svelte";
  import { createEventDispatcher} from 'svelte';
import { bind } from "svelte/internal";

  export let session;
  $: files = null;
  let results;
  let source = null;
  let commenter = null;
  let uname = session.account.label;
  let commentbox = false;
  let filename = null;
  let line = null;
  let comment = null;
  

  function handleClick(){
    var selected_option = document.getElementById("result");
    var filename = selected_option.value;
    const response = fetch(`http://localhost:8000/file?flname=${filename}`)
    commentbox = true;
  }

  onMount(async()=>{
    let userName = session.account.label;
    const response = await fetch(`http://localhost:8000/list/file?uname=testu`)
    files = await response.json();
    console.log(files.files)
    if(files.files.length !== 0){
      results = files.files;
    }
  });
  
let dispatch = createEventDispatcher()

const url = 'http://localhost:8000/file';

// request options
const options = {
    method: 'POST',
    body: JSON.stringify({source}),
    headers: {
        'Content-Type': 'application/json'
    }
}

// send POST request
fetch(url, options)
    .then(res => res.json())
    .then(res => console.log(res));

    const submitHandler = () => {
        console.log(source)
        dispatch('add')
    }


    const comment_url = 'http://localhost:8000/comment';

// request 
const comments = {
    method: 'POST',
    body: JSON.stringify({
      uname,
      line,
      comment,
      filename
    }),
    headers: {
        'Content-Type': 'application/json'
    }
}

// send POST request
fetch(url, comments)
    .then(res => res.json())
    .then(res => console.log(res));

    const commentHandler = () => {
      var selected_option = document.getElementById("result");
      var filename = selected_option.value;
      console.log(comment)
      dispatch('add')
    }


</script>


{#if !files}
  <div>
    <h1>Loading...</h1>
  </div>
 {:else if !results}
  <div>
    <p>You currently have no access to any files</p>
  </div>
{:else}
  <div>
    <h2>Share file To get feedback</h2>
    <form on:submit|preventDefault={submitHandler}>
    <label for="uname"> UserName: </label>
    <input  bind:value={commenter} type="text" name="uname" id="uname"/>
    <br>
    <label for="source"> Source Code: </label>
    <input
      type="file"
      name="source"
      id="source"
      bind:value={source}
    />
    <button type="submit" >Submit</button>
    <br>
    </form>
    <hr>
    
    <br>
    <h2>Comment Code</h2>
    <form on:submit|preventDefault={commentHandler}>
      <label for="result">Choose a file to comment:</label>
      <select name="result" id="result" on:change="{() => filename = ''}" >
      {#each results as result}
        <option value={result} >{result}</option>
      {/each}
      </select>
      <br>
      <label for="line"> Line Number: </label>
      <input  bind:value={line} type="text" name="line" id="line"/>
      <br>
      <label for="comment"> Comment: </label>
      <input
        type="text"
        name="comment"
        id="comment"
        bind:value={comment}
      />
      <button type = "submit">Comment</button>
    </form>
    </div>
  

{/if}