<script>
  import { onMount } from "svelte";

  export let session;
  $: files = null;
  $: commentList = null;
  let results;
  let comments;
  let user;
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
    user = session.account.label;
    const response = await fetch(`http://localhost:8000/list/file?uname=${user}`)
    files = await response.json();
    console.log(files.files)
    if(files.files.length !== 0){
      results = files.files;
    }
  });
  
  const pullComments = async () => {
    console.log("commeemlad");
    let filename = document.getElementById("result1").value;
    const response = await fetch(`http://localhost:8000/comment?filename=${filename}`);
    commentList = await response.json();
    comments = commentList.comments;
  }

  const commentHandler = async () => {
    let filename = document.getElementById("result").value;
    let line = document.getElementById("line").value;
    let uname = document.getElementById("uname").value;
    let comment = document.getElementById("comment").value;

    console.log("Uname", uname);

    var details = {
      'uname': uname,
      'filename' : filename,
      'line': line,
      'comment': comment
    };

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    const response = await fetch("http://localhost:8000/comment", {
      method: 'POST',
      headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
      body: formBody
    });
  }

  const downloadHandler = () => {
    let fl = document.getElementById("result1").value;
    ext_vscode.postMessage({ type: "download", value: fl });
  }
</script>


{#if !files}
  <div>
    <h1>Loading...</h1>
  </div>
 {:else if !results}
  <div>
    <p>You currently have no access to any files</p>
    <hr>
    <button
      on:click={() => {
        ext_vscode.postMessage({ type: "upload", value: "success" });
      }}
    > Share File </button>
  </div>
{:else}
  <div>
    <button
      on:click={() => {
        ext_vscode.postMessage({ type: "upload", value: "success" });
      }}
    > Share File </button>
    <hr>
    <form>
      <label for="result">Choose a file to comment:</label>
      <select name="result" id="result">
      {#each results as result}
        <option value={result} >{result}</option>
      {/each}
      </select>
      <label for="line"> Line Number: </label>
      <input type="text" name="line" id="line"/>
      <br>
      <label for="comment"> Comment: </label>
      <input
        type="text"
        name="comment"
        id="comment"
      />
      <input type="hidden" name="uname" id="uname" value={user}/>
      <button type = "submit" on:click={commentHandler}>Comment</button>
    </form>
    <hr>
    
    <br>
      <form>
        <label for="result1">Select a file to load comments:</label>
        <select name="result1" id="result1">
        {#each results as result}
          <option value={result} >{result}</option>
        {/each}
        </select>
        <button type = "submit" on:click={downloadHandler}>Download</button>
        <button type = "submit" on:click={pullComments}>Load Comment</button>
      </form>
      {#if commentList}
        {#each comments as comment}
          <div>
            <p><span style="color: #add8e6">Line:</span> {comment.lines}</p>
            <p><span style="color: green"> Description: </span> {comment.description}</p>
            <p><span style="color: green">Created At:</span>{comment.createdAt}</p>
            <p><span style="color: green"> Created By: </span> {comment.createdBy}</p>
          </div>
          <br>
        {/each}
      {/if}
    </div>
{/if}