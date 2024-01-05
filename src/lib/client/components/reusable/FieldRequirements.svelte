<script lang="ts">
    import { List, Li, Heading, Popover } from 'flowbite-svelte';
    import { QuestionCircleSolid, CheckCircleSolid , CloseCircleSolid} from 'flowbite-svelte-icons'; // Importing the icons
    import type { Placement } from '@floating-ui/dom';
	
    export let requirementsPlacement: Placement = 'bottom-start';
    export let requirementsType: string;
    export let popoverButtonId: string;
    export let satisifedRequirements: string[] = [];
    export let unsatisfiedRequirements: string[]=[];

</script>

<button type="button" id={popoverButtonId}>
    <QuestionCircleSolid class="w-4 h-4 ml-1.5" />
    <span class="sr-only">Show requirements for {requirementsType}</span>
</button>
<Popover
    triggeredBy="#{popoverButtonId}"
    class="w-72 text-sm font-light text-gray-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
    placement={requirementsPlacement}
>
    
        <Heading tag="h6">Satisfied {requirementsType} requirements:</Heading>
        <List list="disc">
            {#each satisifedRequirements as satisifedRequirement}
				
                <Li icon>
                    <CheckCircleSolid class="w-4 h-4 mr-1 text-green-500 inline" />
					<p>{satisifedRequirement}</p>
					
                </Li>
            {/each}
        </List>
    
	<!-- {#if satisifedRequirements.length > 0} Check if there are satisfied requirements -->
	{#if unsatisfiedRequirements.length == 0 &&  satisifedRequirements.length == 0 }
		{#if requirementsType == "username"}
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The username must be between 4 and 12 characters long
			</Li>
		 	<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The username must not contain any leading, trailing or inline spaces
			</Li>
		{/if}
		{#if requirementsType == "email"}
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The email must be between 1 and 254 characters long
			</Li>
		{/if}
		{#if requirementsType == "password"}
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The password must be between 8 and 50 characters long
			</Li>
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The password must contain at least one lowercase character
			</Li>
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The password must contain at least one uppercase character
			</Li>
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The password must contain at least one number
			</Li>
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				The password must contain at least one special charcter
			</Li>
			<Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				Passwords should match
			</Li>
		{/if}
	{/if}
    <!-- <Heading tag="h6">Unsatisfied {requirementsType} requirements</Heading> -->
    <List list="disc">
        {#each unsatisfiedRequirements as unsatisfiedRequirement}
            <Li icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
				
                <p>{unsatisfiedRequirement}</p>
				
            </Li>
        {/each}
    </List>
	<!-- {/if} -->
</Popover>
