/// <reference types="jquery"/>
/// <reference types="js-cookie"/>
/// <reference path="./Lorenz.ts"/>
/// <reference path="./GridSearch.ts"/>

$(function () {
  // Gravitation, Swarm intelligence, Delaunay face, machine learning, stereoscopic simulations, Hyperloop!
  const animations = [
    {
      title: "Lorenz Strange Attractor",
      desc:
        "A beautiful chaotic attractor. Click or tap anywhere to add streamers.",
      init: Lorenz,
      scaling: "keep-aspect-ratio",
    },
    {
      title: "A* Grid Search",
      desc: "A simple pathfinding algorithm.",
      init: GridSearch,
      scaling: "stretch",
    },
  ];

  // Pick a random animation.
  let animationIndex;
  let prevAnimationIndex =
    (Cookies.getJSON("animationIndex") &&
      Cookies.getJSON("animationIndex").i) ||
    -1;
  do {
    animationIndex = Math.floor(Math.random() * animations.length);
  } while (animations.length > 1 && animationIndex == prevAnimationIndex);
  Cookies.set("animationIndex", { i: animationIndex });
  let animation = animations[animationIndex];

  const getDims = () => {
    return {
      width: $("body").outerWidth(),
      height: $("body").outerHeight(),
      ratio: $("body").outerWidth() / $("body").outerHeight(),
    };
  };
/*
  // Set original canvas dimensions
  let orig_dims = getDims();
  $("canvas#splash").attr(orig_dims);

  // Make the canvas automatically resize without redrawing (CSS resize only)
  $(window)
    .resize(() => {
      let curr_dims = getDims();
      if (animation.scaling == "stretch") {
        $("canvas#splash").css({
          width: curr_dims.width,
          height: curr_dims.height,
        });
      } else if (animation.scaling == "keep-aspect-ratio") {
        $("canvas#splash").css(
          curr_dims.ratio > orig_dims.ratio
            ? {
                width: curr_dims.width,
                height: curr_dims.width / orig_dims.ratio,
                "margin-left": 0,
                "margin-top":
                  (curr_dims.height - curr_dims.width / orig_dims.ratio) / 2,
              }
            : {
                width: curr_dims.height * orig_dims.ratio,
                height: curr_dims.height,
                "margin-left":
                  (curr_dims.width - curr_dims.height * orig_dims.ratio) / 2,
                "margin-top": 0,
              }
        );
      }
    })
    .resize();
*/
  // Deal with scaling problems for onclick/touch
  $(window).on("mousedown click touchstart tap touch", (e) => {
    let curr_dims = getDims();
    if (animation.scaling == "stretch") {
      return props.onclicktouch(
        e.pageX / (curr_dims.width / orig_dims.width),
        e.pageY / (curr_dims.height / orig_dims.height)
      );
    } else if (animation.scaling == "keep-aspect-ratio") {
      let scale =
        curr_dims.ratio > orig_dims.ratio
          ? curr_dims.width / orig_dims.width
          : curr_dims.height / orig_dims.height;
      return props.onclicktouch(
        (e.pageX - parseInt($("canvas#splash").css("margin-left"))) / scale,
        (e.pageY - parseInt($("canvas#splash").css("margin-top"))) / scale
      );
    }
  });

  // Fetch and run the simulation
  let props = animation.init("canvas#splash");

  // Now that it's loaded, fade in and add content
  $("canvas#splash").css({ opacity: 1 });
  $("#simulation-name").text(animation.title);

  return $("#simulation-info").show();
});
