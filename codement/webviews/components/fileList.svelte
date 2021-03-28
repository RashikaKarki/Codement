<script>
  import { onMount } from "svelte";

  export let session;
  $: files = null;
  let results;

  onMount(async()=>{
    let userName = session.account.label;
    const response = await fetch(`http://localhost:8000/list/file?uname=${userName}`)
    files = await response.json();
    if(files.files.length !== 0){
      results = files.files;
    }
  });
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
    <label for="result">Choose a file to comment:</label>
    <select name="result" id="result">
    {#each results as result}
      <option value={result}>{result}</option>
    {/each}
    </select>
  </div>
{/if}