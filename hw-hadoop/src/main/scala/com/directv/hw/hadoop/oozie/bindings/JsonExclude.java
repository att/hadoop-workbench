package com.directv.hw.hadoop.oozie.bindings;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Retention(RUNTIME) @Target({FIELD, METHOD, PARAMETER})
public @interface JsonExclude {

}
