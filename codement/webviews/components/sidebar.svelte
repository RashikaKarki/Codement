<script>
  import { onMount } from "svelte";
  import FileList from './fileList.svelte';

  $: session = null;
  $: files = null;

  window.addEventListener("message", async (event) => {
    const message = event.data;

    switch (message.command) {
      case "authComplete":
        var details = {
        'uname': message.payload.session.account.label,
        };

        var formBody = [];
        for (var property in details) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(details[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        const response = await fetch("http://localhost:8000/user/log", {
          method: 'POST',
          headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
          body: formBody
        });

        session = message.payload.session;
        console.log(session);
        break;
    }
  });
  // send message as soon as sidebar loads.
  ext_vscode.postMessage({ type: "onSignIn", value: "success" });

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
{:else}
  <FileList {session} />
{/if}