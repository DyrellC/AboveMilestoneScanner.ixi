# AboveMilestoneScanner.ixi
This tool will scan for transactions above the latest milestone to find unconfirmed value transactions and persist valid transaction addresses to the spent-addresses-db [1.8.4] or localsnapshots-db [1.9.0].

### How to run 
Place tool in the target ixi folder for your node and make the following call: 
`curl http://[ host ]:[ port ] -X POST -H 'X-IOTA-API-Version: 1.4.1' -H 'Content-Type: application/json'   -d '{"command": "AboveMilestoneScanner.persistSpentAddresses"}'`


### Response
Will provide the results in the following response format: 
```
"totalAnalyzed": 1180170,
"valueTransactionsFound": 9256,
"validSpends": 99,
"milestoneHash": "RSVYL9SZJLFM99DDVCNSASYYBT9ASEETP9BTAEFVTVVLHQUMXHNOSIZMVWORQRVRRVSUMQBTKGXRA9999",
"milestoneIndex": 1341705,
"spentAddressesBefore": 14636805,
"spentAddressesAfter": 14636888
```
