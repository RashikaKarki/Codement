<script>
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { setClient } from "svelte-apollo";
	
	$: session = null;
	
	window.addEventListener("message", async (event) => {
	  const message = event.data;
	  switch (message.command) {
		case "authComplete":
		  session = message.payload.session;
		  break;
		case "projectChosen":
		  project = message.payload.project;
		  container = message.payload.container;
		  break;
	  }
	});
	// send message as soon as sidebar loads.
	ext_vscode.postMessage({ type: "onSignIn", value: "success" });
	let client;
	$: {
	  if (session) {
		client = new ApolloClient({
		  uri: "https://api.github.com/graphql",
		  cache: new InMemoryCache(),
		  headers: {
			authorization: `Bearer ${session.accessToken}`,
		  },
		});
		setClient(client);
	  }
	}
  </script>
  
  {#if !session}
	<div>
	  <p>Sign in with GitHub to get started.</p>
	  <button
		on:click={() => {
		  //send message to SidebarProvider.ts
		  global.ext_vscode.postMessage({ type: "onSignIn", value: "success" });
		}}
	  >
		Sign in with GitHub
	  </button>
	</div>
  {:else}
	<div>
	  <h2 style="margin-bottom: 1rem">Share Code</h2>
	</div>
  {/if}