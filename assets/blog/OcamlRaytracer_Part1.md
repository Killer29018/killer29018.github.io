---
title: OCaml Ray tracer
author: Aaron Danton
date: 2024-07-05
complete: false
...

# Writing a software ray tracer in OCaml

Building a ray tracer is a great introduction to graphics, and even a basic
hobby ray tracer can provide great insight into how larger, commercial ray tracer's
work. A basic ray tracer can be simple enough that they can be implemented in nearly
every language, requiring only the ability to print out messages to form full
images using the [ppm](https://en.wikipedia.org/wiki/Netpbm) image format.

A great introduction into building a hobby ray tracer is following the
book series [ray tracing in one weekend](https://raytracing.github.io/) by Peter Shirley, Trevor D Black and
Steve Hollasch. The book series uses only c++ and the standard library which means
if you have never wrote a ray tracer but would like to find somewhere to start I
would highly recommend starting with this series, even only following the first book in the series is
a great introduction to the in-depth world of ray tracers.

With the help of that book series I decided a great way to learn [OCaml](https://ocaml.org/) was
by implementing a ray tracer. In particular this first part, in what is hopefully
a series of blogs, implements all the features from the [first book](https://raytracing.github.io/books/RayTracingInOneWeekend.html).
With that this blog will go over the basics of implementing a ray tracer in OCaml
and will highlight some of the positives to using a functional language.

## The beginning
The first step in implementing any ray tracer is being able to get an image of what
is being rendered. To begin I created two modules, one for a 3D vector, and one
for each pixel. The basic implementation of these two modules is as follows:

```ocaml
(* Vec3.ml *)
module Vec3 = struct
    type vec3 = {
        x: float;
        y: float;
        z: float;
    }

    let create x y z =
        { x = x; y = y; z = z }

    let zero = create 0. 0. 0.
    let one = create 1. 1. 1.

    let add a b =
        { x = a.x +. b.x; y = a.y +. b.y; z = a.z +. b.z }

    let sub a b =
        { x = a.x -. b.x; y = a.y -. b.y; z = a.z -. b.z }

    let dot a b =
        a.x *. b.x +. a.y *. b.y +. a.z *. b.z

    let scalar a s =
        { x = a.x *. s; y = a.y *. s; z = a.z *. s }

    let comp_mul a b =
        { x = a.x *. b.x; y = a.y *. b.y; z = a.z *. b.z }

    let mag_squared v =
        dot v v

    let mag v =
        sqrt (mag_squared v)

    let norm v =
        scalar v (1. /. (mag v))

    let negate v =
        scalar v ~-.1.
end
```

```ocaml
(* Pixels.ml *)
open Vec3
module Pixels = struct
    type pixel = {
        x: int;
        y: int;
        z: int;
    }

    let pixel_of_vec3 (v : Vec3.vec3) =
        let x = int_of_float (v.x *. 255.) in
        let y = int_of_float (v.y *. 255.) in
        let z = int_of_float (v.z *. 255.) in
        { x = x; y = y; z = z }

    let string_of_pixel p =
        Printf.sprintf "%3d %3d %3d" p.x p.y p.z
end
```

The pixel type is used as an intermediary between the colours generated by the ray tracer,
where each component has a value between 0-1, and the output required for the ppm image
format where an 8 bit integer is required for each rgb colour component.

These modules provide the basis of an image, meaning all that is needed now is a
wrapper around the data of the image and a way to output that data to the console,
allowing us to pipe that output to a file

> To try and clear up confusion that may occur, an image consists of pixels, which in this
> context can either be a vec3 or a pixel type. For this reason I will refer to the pixels
> in an image as the data of the image.

### Breakdown of the ppm image format
The ppm image format used here consists of a header and then the data.

The header solely consists of a type (In our case that is P3), the max bit depth, and then
the width and height of the image.

Then for the data each row is an individual pixel
consisting of three integers with spaces in between representing the red, green and blue
channels. An integer equal to the bit depth would represent full intensity while 0
represents no intensity.

Typically the maximum bit depth is 255, however some image
viewers do allow for a limit of 65535. A simple example of a ppm image is
```txt
P3
3 2
255
255   0   0
  0 255   0
  0   0 255
255 255   0
255 255 255
  0   0   0
```
which, when scaled up, generates the following image
![](../assets/imgs/blogs/OcamlRaytracer_Part1/example_ppm.png)

## Images

```ocaml
(* Image.ml *)
open Vec3
open Pixel
module Image = struct
    type 'a image = {
        width: int;
        height: int;
        data: 'a array array
    }

    let map f i =
        {
            width = i.width;
            height = i.height;
            data = Array.map (fun r -> Array.map (fun x -> f x) r) i.data
        }

    let mapi f i =
        {
            width = i.width;
            height = i.height;
            data = Array.mapi (fun yp r -> Array.mapi (fun xp x -> f x xp yp) r) i.data
        }

    let iter f i =
        Array.iter (fun r -> Array.iter (fun x -> f x) r) i.data

    let create_vec3_image w h =
        { width = w; height = h; data = Array.make_matrix w h Vec3.zero }

    let pixel_image_of_vec3_image i =
        map (Pixels.pixel_of_vec3) i

    let print_pixel_image i =
        iter (fun x -> Printf.printf "%s\n" (Pixels.string_of_pixel x)) i

    let ppm_of_pixel_image i =
        Printf.printf "P3\n%d %d\n255\n" i.width i.height;
        print_pixel_image i
end
```

And finally we can add into the main file some code that can produce a basic image.
For example we can generate a checkerboard with the following code
```ocaml
(* main.ml *)
open Vec3
open Image

let () =
    let checkerboard _p x y =
        if (x + y) mod 2 == 0 then
            Vec3.one
        else
            Vec3.zero
    in
    let image = Image.generate_vec3_image 20 20 in
    let image = Image.mapi checkerboard image in
    Image.ppm_of_pixel_image (Image.pixel_image_of_vec3_image image)
```

Which, if all has been done correctly, should output something along the lines of
```txt
P3
20 20
255
255 255 255
  0   0   0
255 255 255
  0   0   0
255 255 255
  0   0   0
     .
     .
     .
     .
```
If this output is piped to a file with a .ppm extension, and a suitable image viewer
is used then the following image should become visible

![](../assets/imgs/blogs/OcamlRaytracer_Part1/checkerboard.png)

## Casting rays
Now that we have a way of representing images we can start implementing the ability
to cast rays into the scene. For this we will need to implement the following modules:

* Ray: A simple wrapper around two Vec3's, one representing the origin, and the other representing the direction
* Hit Record: A collection of data that returns relevant information about the hit position on a shape
* Viewport: Has a size independent of the image, allowing for the output image
  to be resized while the rendered output will remain the same
* Shape: Represents anything that a ray can intersect with
* Object: A collection of data that represents any object in the final scene, for know only
  includes a shape, but will eventually include materials
* Scene: A collection of objects, and required parameters for rendering the scene

We will start at the top of the list and work down.

### Rays
The ray is probably the simplest module that is needed to be implemented
```ocaml
(* Ray.ml *)
open Vec3
module Ray = struct
    type ray = {
        origin: Vec3.vec3;
        direction: Vec3.vec3;
    }

    let create o d = { origin = o; direction = d }

    let calculate_position r t =
        Vec3.add r.origin (Vec3.scalar r.direction t)
end
```

### Hit record
A hit record requires a small bit more work but not much
```ocaml
(* HitRecord.ml *)
open Vec3
module HitRecord = struct
    type hit_record = {
        mutable t: float;
        mutable pos: Vec3.vec3;
        mutable normal: Vec3.vec3;
        mutable is_front_face: bool;
    }

    type hit = Miss
             | Hit of hit_record

    let create_null =
        fun () -> {
            t = 0.;
            pos = Vec3.zero;
            normal = Vec3.zero;
            is_front_face = true;
        }
end
```
Mutable here is used to denote that we may change the parameters after creating a hit_record
object. This is used for easier assigning to the record values when creating a hit_record

### Viewport
```ocaml
(* Viewport.ml *)
open Vec3
open Image
module Viewport = struct
    type viewport_T = {
        width: float;
        height: float;
        depth: float
    }

    let create_null =
        fun () -> {
            width = 0.;
            height = 0.;
            depth = 0.
        }

    let create width height depth =
        {
            width = width;
            height = height;
            depth = depth
        }

    let get_components v (i : 'a Image.image) =
        let half_width = v.width /. 2. in
        let half_height = v.height /. 2. in

        let origin = Vec3.zero in
        let front = Vec3.create 0. 0. 1. in
        let right = Vec3.create 1. 0. 0. in
        let up = Vec3.create 0. ~-.1. 0. in

        let center = Vec3.add (Vec3.scalar front v.depth) origin in
        let left = Vec3.add (Vec3.scalar (Vec3.negate right) half_width) center in

        let top_left = Vec3.add (Vec3.scalar up half_height) left in
        let delta_right = Vec3.scalar right (v.width /. (float_of_int i.width)) in
        let delta_down = Vec3.scalar (Vec3.negate up) (v.height /. (float_of_int i.height)) in

        (top_left, delta_right, delta_down)
end
```

### Shape
The shape module has a lot more work required compared to the previous two, requiring
some maths to calculate the intersection of a sphere and a ray which can be seen below.

#### Ray sphere Derivation
We can define the ray as
$$ \underline{r} = \underline{o} + t\underline{d} $$
where $\underline{r}$ is our ray and $\underline{o}$, $\underline{d}$ our the origin and direction respectively.

We can then define a point on the sphere at the origin as
$$ \vert\underline{p}\vert = r^2 $$
where $\underline{p}$ is some point and $r$ is the radius of the sphere

For a sphere not originating at the origin but instead at a point $\underline{c}$ is defined as
$$ \vert\underline{p} - \underline{c}\vert = r^2 $$

Replacing $\underline{p}$ with the equation for the ray we get
$$ \vert\underline{o} + t\underline{d} - \underline{c}\vert = r^2 $$

Expanding out the left hand side we get
$$ (\underline{o} + t\underline{d} - \underline{c}) \cdot (\underline{o} + t\underline{d} - \underline{c}) = r^2 $$
Which can be simplified to
$$ (\underline{o}^2 + \underline{c}^2 + t^2\underline{d}^2 + 2t \underline{d}\cdot\underline{o} - 2 \underline{o}\cdot\underline{c} -2t \underline{d}\cdot\underline{c}) = r^2 $$
Re-ordering around $t$ results in
$$ t^2(\underline{d}^2) + 2t (\underline{d}\cdot\underline{o} - \underline{d}\cdot\underline{c}) + \underline{o}^2 - 2 \underline{o}\cdot\underline{c} + \underline{c}^2 - r^2 = 0$$
$$ t^2(\underline{d}^2) + 2t \underline{d}\cdot(\underline{o} - \underline{c}) + (\underline{o} - \underline{c})^2 - r^2 = 0 $$

If we then relabel some of the components we get
$$ at^2 + bt + c = 0 $$
Where
$$ a = \underline{d}^2 $$
$$ b = 2\underline{d}\cdot(\underline{o} - \underline{c}) $$
$$ c = (\underline{o} - \underline{c})^2 - r^2 $$

Therefore we can then use the quadratic formula to solve for $t$ getting us
$$ t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$

We can simplify this further be defining $2 \lambda = b$ which results in
$$ t = \frac{-2\lambda \pm \sqrt{4\lambda^2 - 4ac}}{2a} $$
$$ t = \frac{-2\lambda \pm 2\sqrt{\lambda^2 - ac}}{2a} $$
$$ t = \frac{-\lambda \pm \sqrt{\lambda^2 - ac}}{a} $$

#### Code
```ocaml
(* Shape.ml *)
open Vec3
open HitRecord
open Ray
module Shape = struct
    type sphere_data = {
        centre: Vec3.vec3;
        radius: float;
    }

    exception ShapeError of string

    type shape_T = None
                 | Sphere of sphere_data

    let create_sphere c r =
        Sphere { centre = c; radius = r }

    let get_normal s p =
        match s with
        | Sphere s ->
            Vec3.norm (Vec3.sub p s.centre)
        | _ -> raise (ShapeError "Normal is not defined for this shape")

    let get_normal_and_front_face s p d =
        let normal = get_normal s p in
        let dot = Vec3.dot normal d in
        if dot < 0. then
            (normal, true)
        else
            (Vec3.negate normal, false)

    let sphere_ray_collision (r : Ray.ray) s =
        let o_c = Vec3.sub r.origin s.centre in
        let a = Vec3.dot r.direction r.direction in
        let half_b = Vec3.dot r.direction o_c in
        let c = (Vec3.dot o_c o_c) -. (s.radius *. s.radius) in
        let disc = ((half_b *. half_b) -. (a *. c)) in
        if disc < 0. then
            HitRecord.Miss
        else
            let disc = sqrt disc in
            let t =
                if (~-.half_b -. disc) > 0.001 then
                    (~-.half_b -. disc) /. a
                else if (~-.half_b +. disc) > 0.001 then
                    (~-.half_b +. disc) /. a
                else
                    ~-.1.
            in
            if t <= 0. then
                HitRecord.Miss
            else
                let pos = Ray.calculate_position r t in
                let (normal, front_face) = get_normal_and_front_face (Sphere s) pos r.direction in
                let hit_record = HitRecord.create_null () in
                hit_record.t <- t;
                hit_record.pos <- pos;
                hit_record.normal <- normal;
                hit_record.is_front_face <- front_face;
                HitRecord.Hit (hit_record)

    let check_collision r shape =
        match shape with
        | Sphere s -> sphere_ray_collision r s
        | _ -> raise (ShapeError "No collision defined for shape")
end
```

### Object
Now we can define an object, for now this is solely a wrapper around a shape, but will eventually
be used to add materials
```ocaml
(* Object.ml *)
open Shape
module Object = struct
    type object_T = {
        shape: Shape.shape_T;
    }

    let create s = {
        shape = s
    }

    let check_collision o r =
        Shape.check_collision r o.shape
end
```

### Scene
Finally we can implement the scene. This will be where most of the actual ray tracer actually occurs
and so ends up being relatively complex. For now though, it remains pretty simple

```ocaml
(* Scene.ml *)
open Object
open Ray
open Vec3
open Viewport
open Image
module Scene = struct
    type scene_definition = {
        mutable objects: Object.object_T array;

        mutable image_width: int;
        mutable image_height: int;

        mutable viewport: Viewport.viewport_T;
    }

    let create_null =
        fun () -> {
            objects = [||];
            image_width = 0;
            image_height = 0;
            viewport = Viewport.create_null ();
        }

    let add_object def o =
        def.objects <- (Array.append def.objects [| o |]);
        def

    let calculate_colour _scene _ray =
        Vec3.zero

    let per_pixel x y scene origin top_left right_delta down_delta =
        let right = Vec3.scalar right_delta (float_of_int x) in
        let down = Vec3.scalar down_delta (float_of_int y) in

        let ray_origin = origin in
        let target = Vec3.add top_left (Vec3.add right down) in
        let ray = Ray.create ray_origin (Vec3.sub target ray_origin) in

        let colour = calculate_colour scene ray in
        colour

    let render_scene scene =
        let origin = Vec3.zero in
        let image = Image.create_vec3_image scene.image_width scene.image_height in
        let (top_left, right, down) = Viewport.get_components scene.viewport image in
        let output_image = Image.mapi
            (fun _c x y -> per_pixel x y scene origin top_left right down) image in
        Image.ppm_of_pixel_image (Image.pixel_image_of_vec3_image output_image)
end
```

The code at the minute should produce a solid black screen

### Main
We can now rewrite the main class to utilise this new scene class

```ocaml
(* main.ml *)
open Scene
open Shape
open Object
open Viewport
open Vec3
let () =
    let sphere = Shape.create_sphere (Vec3.create 0. 0. 1.) 0.5 in
    let obj1 = Object.create sphere in

    let viewport = Viewport.create 2. 2. 1. in

    let scene_def = Scene.create_null () in
    let scene_def = Scene.add_object scene_def obj1 in
    scene_def.image_width <- 200;
    scene_def.image_height <- 200;
    scene_def.viewport <- viewport;
    Scene.render_scene scene_def
```
which generates the following image
![](../assets/imgs/blogs/OcamlRaytracer_Part1/solid.png)

## Proper ray calculations
If we replace the temporary code we placed in calculate_colour we
can start calculating the proper ray intersections
```ocaml
(* Scene.ml *)
let calculate_colour scene ray =
    let collisions = Array.mapi (fun i o -> (i, Object.check_collision o ray)) scene.objects in
    let (_index, closest) = Array.fold_left
        (fun (index, hit) (i, x) ->
            match hit, x with
            | HitRecord.Miss, _ -> (i, x)
            | HitRecord.Hit _h, HitRecord.Miss -> (index, hit)
            | HitRecord.Hit h1, HitRecord.Hit h2 ->
                if h1.t < h2.t then
                    (index, hit)
                else
                    (i, x)
        ) (-1, HitRecord.Miss) collisions in
    match closest with
        | HitRecord.Miss ->
                miss_colour ray
        | HitRecord.Hit _h ->
            Vec3.create 1. 0. 0.
```

This also requires us to implement a miss_colour function and to also
open HitRecord at the top of the file

```ocaml
(* Scene.ml *)
let miss_colour _r =
    Vec3.create 0. 1. 1.
```
Which finally generates our first ray traced image
![](../assets/imgs/blogs/OcamlRaytracer_Part1/first_raytraced.png)

## Rendering normals
Before implementing any materials we can first see if the normals are being
calculated properly by first implementing a scatter_ray method to our object

```ocaml
(* Object.ml *)
let scatter_ray _o (_r : Ray.ray) (h : HitRecord.hit_record) =
    let c_r = Float.abs h.normal.x in
    let c_g = Float.abs h.normal.y in
    let c_b = Float.abs h.normal.z in
    let colour = Vec3.create c_r c_g c_b in
    Some (colour, Ray.create Vec3.zero Vec3.zero)
```
And then once again modifying calculate_colour to
```ocaml
let calculate_colour scene ray =
    let collisions = Array.mapi (fun i o -> (i, Object.check_collision o ray)) scene.objects in
    let (index, closest) = Array.fold_left
        (fun (index, hit) (i, x) ->
            match hit, x with
            | HitRecord.Miss, _ -> (i, x)
            | HitRecord.Hit _h, HitRecord.Miss -> (index, hit)
            | HitRecord.Hit h1, HitRecord.Hit h2 ->
                if h1.t < h2.t then
                    (index, hit)
                else
                    (i, x)
        ) (-1, HitRecord.Miss) collisions in
    match closest with
        | HitRecord.Miss ->
                miss_colour ray
        | HitRecord.Hit h ->
            let obj = scene.objects.(index) in
            let result = Object.scatter_ray obj ray h in
            match result with
            | Some (c, _r) ->
                    c
            | None ->
                    Vec3.zero
```
will allow us to see the following image
![](../assets/imgs/blogs/OcamlRaytracer_Part1/first_normals.png)

### A better scene
Due to the implementation of our calculate_colour function we are able
to easily add multiple objects to the scene, with the following
code we add 3 separate spheres, which we will give different materials when
we implement the material system

```ocaml
(* main.ml *)
open Scene
open Shape
open Object
open Viewport
open Vec3
let () =
    let left_sphere = Shape.create_sphere (Vec3.create ~-.1.2 0. 2.) 0.5 in
    let center_sphere = Shape.create_sphere (Vec3.create 0. 0. 2.2) 0.5 in
    let right_sphere = Shape.create_sphere (Vec3.create 1.2 0. 2.) 0.5 in
    let ground_sphere = Shape.create_sphere (Vec3.create 0. 100.5 2.) 100. in

    let left_obj = Object.create left_sphere in
    let center_obj = Object.create center_sphere in
    let right_obj = Object.create right_sphere in
    let ground_obj = Object.create ground_sphere in

    let viewport = Viewport.create 2. 2. 1. in

    let scene_def = Scene.create_null () in
    let scene_def = Scene.add_object scene_def left_obj in
    let scene_def = Scene.add_object scene_def center_obj in
    let scene_def = Scene.add_object scene_def right_obj in
    let scene_def = Scene.add_object scene_def ground_obj in
    scene_def.image_width <- 200;
    scene_def.image_height <- 200;
    scene_def.viewport <- viewport;
    Scene.render_scene scene_def
```
Which generates ![](../assets/imgs/blogs/OcamlRaytracer_Part1/three_spheres_normal.png)

## Materials
First we need to add some new functions to our vec3 module. This is mostly
for generating random vectors. This is because the lambertian material we will be implementing
first effectively models the microfacets in a surface. Meaning any ray that hits an object has
a chance to bounce in any other direction with a slight preference to towards the normal.