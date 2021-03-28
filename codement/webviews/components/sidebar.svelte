<script>
  import { onMount } from "svelte";

  $: session = null;
  $: files = null;
  let result;

  window.addEventListener("message", async (event) => {
    const message = event.data;

    switch (message.command) {
      case "authComplete":
        session = message.payload.session;
        console.log(session);
        break;
    }
  });
  // send message as soon as sidebar loads.
  ext_vscode.postMessage({ type: "onSignIn", value: "success" });

  // getResponse = async ()=>{
  //   const response = await fetch("http://localhost:8000/list/file?uname=testu")
  //   files = await response.json();
  //   result = files.files[0];
  //   console.log(files);
  // }

  onMount(async()=>{
    const response = await fetch("http://localhost:8000/list/file?uname=testu")
    files = await response.json();
    result = files.files[0];
    console.log(files);
  });

</script>

{#if !session}
  <div>
    <p>Sign in with GitHub to get started.</p>
    <button
      on:click={ 
        () => { //send message to SidebarProvider.ts
          ext_vscode.postMessage({type: 'onSignIn', value: 'success'});
        }
      }
    > Sign in with GitHub </button>
  </div>
{:else if files}
  <div>
    <h1>{result}</h1>
  </div>
{/if}