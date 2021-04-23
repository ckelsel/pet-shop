App = {
  web3Provider: null,
  contracts: {},

  init: function () {
    // Load pets.
    $.getJSON('../pets.json', function(pets){
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
  
      for (i = 0; i < pets.length; i++) {
        petTemplate.find('.panel-title').text(pets[i].name);
        petTemplate.find('img').attr('src', pets[i].picture);
        petTemplate.find('.pet-breed').text(pets[i].breed);
        petTemplate.find('.pet-age').text(pets[i].age);
        petTemplate.find('.pet-location').text(pets[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', pets[i].id);
  
        petsRow.append(petTemplate.html());
      }
    })
    

    return App.initWeb3();
  },

  initWeb3: async function () {
    //----
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    //----
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('../Adoption.json', function (data) {
      
      var AdoptionABI = data;

      // create contract interface using json data
      App.contracts.Adoption = TruffleContract(AdoptionABI);

      // set contract provider
      App.contracts.Adoption.setProvider(App.web3Provider);

      // update adoption status every 5 seconds
      setInterval(App.markAdopted, 5000);

      // mark adopted pet
      return App.markAdopted();
    });

    // bind events to controls
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  handleAdopt: function () {
    event.preventDefault();

    var button = $(this);
    var petId = parseInt($(event.target).data('id'));

    // disable button during process
    button.text('Processing..').attr('disabled', true);

    // get all accounts of current user
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.error(error);
        button.text('Adopt').removeAttr('disabled');
        return;
      }

      // get first (base) account
      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (adoptionInstance) {
          return adoptionInstance.adopt(petId, {
            from: account,
          });
        })
        .then(function (result) {
          alert('Adoption success!');
          return App.markAdopted();
        })
        .catch(function (err) {
          // enable button again on error
          button.text('Adopt').removeAttr('disabled');
          console.log(err.message);
        });
    });
  },

  markAdopted: function (adopters, account) {
    // get deployed contract instance
    App.contracts.Adoption.deployed()
      .then(function (adoptionInstance) {
        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        // update owner info
        adopters.forEach(function (adopter, i) {
          if (adopter !== '0x0000000000000000000000000000000000000000') {
            $('.panel-pet')
              .eq(i)
              .find('.pet-owner')
              .text(adopter);
            $('.panel-pet')
              .eq(i)
              .find('button')
              .text('Adopt')
              .attr('disabled', false);
          }
        });
      })
      .catch(function (err) {
        console.error(err.message);
      });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
